const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY missing from .env.local");
  process.exit(1);
}

const TARGET_MCQ_COUNT = 30; // Aim to generate 30 per deficient subject to save time

async function generateWithOpenRouter(subjectName) {
  console.log(`Asking OpenRouter for 10 high-yield MCQs for ${subjectName}...`);
  
  const prompt = `
You are an expert medical professor creating questions for the FCPS (Fellowship of College of Physicians and Surgeons) exam.
Generate exactly 10 high-yield, challenging multiple-choice questions for the subject: "${subjectName}".

Return ONLY a JSON array of objects with the following format:
[
  {
    "question": "Question text...",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "option_e": "Fifth option (or null if only 4 options)",
    "correct_answer": "A", // Or B, C, D, E
    "topic_name": "Specific sub-topic within ${subjectName}",
    "explanation": "Clear, concise medical explanation of why this answer is correct and others are wrong.",
    "difficulty": "hard" // "easy", "medium", or "hard"
  }
]
No other conversational text!! Output ONLY RAW JSON.
`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
        let err = await response.text();
        throw new Error(`API Error: ${err}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    // In case the AI returned backticks around JSON
    content = content.replace(/```json/g, '').replace(/```/g, '').trim()
    
    // Attempt parsing
    try {
        let result = JSON.parse(content);
        if (result.mcqs) return result.mcqs; 
        if (Array.isArray(result)) return result;
        return Object.values(result); // In case it returns an object where keys are indices
    } catch(e) {
         console.error("Failed to parse JSON for", subjectName, ":", content.substring(0, 100));
         return null;
    }
  } catch(e) {
      console.error("OpenRouter fetch failed:", e.message);
      return null;
  }
}

// In-memory cache for topic IDs
const topicCache = {};
async function getOrCreateTopicId(subjectId, topicName) {
    const key = `${subjectId}-${topicName.toLowerCase()}`;
    if (topicCache[key]) return topicCache[key];

    let { data } = await supabase.from('topics')
        .select('id').eq('subject_id', subjectId).ilike('name', topicName).single();
    
    if (!data) {
        const { data: newTopic, error } = await supabase.from('topics')
            .insert({ subject_id: subjectId, name: topicName })
            .select('id').single();
        if (error) throw error;
        data = newTopic;
    }
    topicCache[key] = data.id;
    return data.id;
}


async function run() {
  // 1. Fetch subjects and their MCQ counts
  const { data: subjects, error } = await supabase.from('subjects').select('id, name, mcqs(count)');
  if (error) throw error;

  console.log("Analyzing Subject Deficiencies...");
  const deficient = [];
  
  for (const s of subjects) {
    const count = s.mcqs[0]?.count || 0;
    if (count < TARGET_MCQ_COUNT) {
        deficient.push({ id: s.id, name: s.name, count});
    }
  }
  
  if (deficient.length === 0) {
      console.log("All subjects have sufficient MCQs!");
      return;
  }

  console.log(`Found ${deficient.length} subjects with < ${TARGET_MCQ_COUNT} MCQs. Beginning augmentation...`);

  for (const sub of deficient) {
      let needed = TARGET_MCQ_COUNT - sub.count;
      console.log(`\n=> [${sub.name}] needs ${needed} more MCQs.`);
      
      let totalInsertedForSubject = 0;
      
      // Generate in batches of 10
      while (totalInsertedForSubject < needed) {
          const generated = await generateWithOpenRouter(sub.name);
          if (!generated || !Array.isArray(generated) || generated.length === 0) {
              console.log("Failed to generate valid batch, retrying in 3s...");
              await new Promise(r => setTimeout(r, 3000));
              continue;
          }
          
          console.log(`Got ${generated.length} questions from API. Formatting for DB...`);
          const rowsToInsert = [];
          for (const item of generated) {
              try {
                  const topicId = await getOrCreateTopicId(sub.id, item.topic_name || "General");
                  rowsToInsert.push({
                      subject_id: sub.id,
                      topic_id: topicId,
                      paper_number: 1, // assume paper 1 for default basic
                      question: item.question || "Unknown",
                      option_a: item.option_a || "N/A",
                      option_b: item.option_b || "N/A",
                      option_c: item.option_c || "N/A",
                      option_d: item.option_d || "N/A",
                      option_e: item.option_e || null,
                      correct_answer: item.correct_answer || "A",
                      explanation: item.explanation || "No explanation provided.",
                      reference_book: "AI Generated (Mistral Large)",
                      difficulty: item.difficulty || "medium",
                      is_published: true
                  });
              } catch (err) {
                  console.error("Error formatting row:", err.message);
              }
          }
          
          if(rowsToInsert.length > 0) {
              const { error: insErr } = await supabase.from('mcqs').insert(rowsToInsert);
              if (insErr) {
                  console.error("DB Insert Failed:", insErr.message);
              } else {
                  totalInsertedForSubject += rowsToInsert.length;
                  console.log(`SUCCESS! Inserted ${rowsToInsert.length} into ${sub.name}. Progress: ${totalInsertedForSubject}/${needed}`);
              }
          }
          
          // Wait to respect API limits
          await new Promise(r => setTimeout(r, 4000));
      }
  }
  
  console.log("\nFinished generating missing MCQs!");
}

run().catch(console.error);
