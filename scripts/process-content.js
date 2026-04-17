const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error("MISTRAL_API_KEY missing from .env.local");
  process.exit(1);
}

// 1. Fetch Subjects to provide to mapping context
let SUBJECTS = {};

async function fetchSubjects() {
  const { data, error } = await supabase.from('subjects').select('id, name');
  if (error) throw error;
  data.forEach(s => SUBJECTS[s.name] = s.id);
  console.log(`Loaded ${Object.keys(SUBJECTS).length} subjects.`);
}

// 2. Parse Markdown
function parseContentMd(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // We'll split by blocks that contain \n\n
  const blocks = content.split(/\n\s*\n/);
  const rawMcqs = [];

  for (let block of blocks) {
    block = block.trim();
    if (!block || block.startsWith('## Page') || block.startsWith('*[Page')) continue;

    const ansMatch = block.match(/\*\*Ans:\s+([A-Ea-e])(\/[A-Ea-e])?\*\*/i);
    if (!ansMatch) continue;

    const correct_answer = ansMatch[1].toUpperCase();

    // Use LLM to do the heavy lifting for formatting. Just provide the block
    let rawExp = '';
    let explanationMatch = block.match(/\*\*Explanation:\*\*(.*)/is);
    if (explanationMatch) rawExp = explanationMatch[1].trim();
    else {
        let inlineMatch = block.match(/\*\*Ans:\s+[A-Ea-e].*?\*\*\s*\((.*?)\)/s);
        if (inlineMatch && inlineMatch[1]) rawExp = inlineMatch[1].trim();
    }

    rawMcqs.push({
        raw_text: block,
        correct_answer,
        scraped_explanation: rawExp
    });
  }

  return rawMcqs;
}

async function callMistralAPI(mcqsBatch) {
  const subjectListStr = Object.keys(SUBJECTS).join(', ');

  const prompt = `
You are a medical AI categorization expert. 
I am sending you a JSON array of ${mcqsBatch.length} raw multiple choice questions extracted via OCR.
For EACH question, you must extract and format the data.
1. Extract the clean question text (remove numbers like '1)' or '1.').
2. Extract the options A, B, C, D (and E if present) cleanly.
3. Determine the EXACT subject name from this list ONLY: [${subjectListStr}]. Default to "Medicine" if unsure.
4. Provide a short, specific medical "topic" (e.g., "Heart Failure", "Ovarian Tumors").
5. Provide a concise, clear explanation for WHY the correct answer is correct. Use the provided scraped_explanation if available.
6. Set difficulty to "easy", "medium", or "hard".

Return a RAW JSON object where keys are the indices (0 to ${mcqsBatch.length-1}) and values are objects like this:
{
  "question": "Clean question text",
  "option_a": "Option text",
  "option_b": "Option text",
  "option_c": "Option text",
  "option_d": "Option text",
  "option_e": "Option text or null",
  "subject_name": "Medicine",
  "topic_name": "Heart Failure",
  "explanation": "...",
  "difficulty": "medium"
}

Do NOT output conversational text. OUTPUT ONLY THE JSON.

Batch data:
${JSON.stringify(mcqsBatch.map((q, i) => ({
    id: i,
    raw_text: q.raw_text,
    correct: q.correct_answer,
    scraped_exp: q.scraped_explanation
})), null, 2)}
`;

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`Mistral API Error: ${await response.text()}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  try {
      return JSON.parse(text);
  } catch (e) {
      console.error("Failed to parse Groq response:", text);
      return {};
  }
}

// In-memory topics cache to minimize DB calls
const topcisCache = {};

async function getOrCreateTopicId(subjectId, topicName) {
    const key = `${subjectId}-${topicName.toLowerCase()}`;
    if (topcisCache[key]) return topcisCache[key];

    // Check DB
    let { data } = await supabase.from('topics').select('id').eq('subject_id', subjectId).ilike('name', topicName).single();
    if (data) {
        topcisCache[key] = data.id;
        return data.id;
    }

    // Create
    const { data: inserted, error } = await supabase.from('topics')
       .insert({ subject_id: subjectId, name: topicName })
       .select('id').single();
    if (error) throw error;
    
    topcisCache[key] = inserted.id;
    return inserted.id;
}

async function processBatches() {
  await fetchSubjects();
  
  const contentPath = path.join(__dirname, '../content.md');
  const rawMcqs = parseContentMd(contentPath);
  console.log(`Parsed ${rawMcqs.length} MCQs from content.md`);

  const BATCH_SIZE = 10; // keep it low to prevent LLM timeouts/truncations
  let insertedCount = 0;

  for (let i = 10; i < rawMcqs.length; i += BATCH_SIZE) {
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(rawMcqs.length/BATCH_SIZE)}...`);
    const batch = rawMcqs.slice(i, i + BATCH_SIZE);
    
    let enrichedData;
    let attempts = 0;
    while(attempts < 3) {
      try {
          enrichedData = await callMistralAPI(batch);
          break;
      } catch(e) {
          console.error("API failed. Retrying in 2 seconds...", e.message);
          await new Promise(r => setTimeout(r, 2000));
          attempts++;
      }
    }

    if (!enrichedData) {
        console.error("Failed to process batch. Skipped.");
        continue;
    }

    const rowsToInsert = [];
    for (let j = 0; j < batch.length; j++) {
        const enriched = enrichedData[String(j)];
        if (!enriched) continue;

        let subject_id = SUBJECTS[enriched.subject_name];
        if (!subject_id) subject_id = SUBJECTS["Medicine"]; // fallback

        const topic_id = await getOrCreateTopicId(subject_id, enriched.topic_name || "General");

        rowsToInsert.push({
            subject_id,
            topic_id,
            paper_number: 1,
            question: enriched.question || "Unknown",
            option_a: enriched.option_a || "N/A",
            option_b: enriched.option_b || "N/A",
            option_c: enriched.option_c || "N/A",
            option_d: enriched.option_d || "N/A",
            option_e: enriched.option_e || null,
            correct_answer: batch[j].correct_answer,
            explanation: enriched.explanation || "No explanation provided.",
            reference_book: "SK Pink / Rafi",
            difficulty: enriched.difficulty || "medium",
            is_published: true
        });
    }

    if (rowsToInsert.length > 0) {
        const { error } = await supabase.from('mcqs').insert(rowsToInsert);
        if (error) console.error("DB Insert Error:", error.message);
        else {
            insertedCount += rowsToInsert.length;
            console.log(`Inserted ${rowsToInsert.length} enriched MCQs.`);
        }
    }
    
    // Wait slightly to respect rate limits
    await new Promise(r => setTimeout(r, 4000));
  }

  console.log(`\nProcessing Complete. Successfully imported and categorized ${insertedCount} new MCQs!`);
}

processBatches().catch(console.error);
