const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

// 1. Manually load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
envConfig.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
  }
})

// 2. Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Memory Cache for lookups
const subjectCache = {}
const topicCache = {}

async function getOrCreateSubject(subjectName, paperNumber) {
  const key = subjectName.trim().toLowerCase()
  if (subjectCache[key]) return subjectCache[key]

  let { data, error } = await supabase
    .from('subjects')
    .select('*')
    .ilike('name', subjectName.trim())

  if (error) {
    throw new Error(`getOrCreateSubject Error: ${error.message}`)
  }

  if (data && data.length > 0) {
    subjectCache[key] = data[0].id
    return data[0].id
  }

  // Create new subject
  const { data: newSub, error: subErr } = await supabase
    .from('subjects')
    .insert([{ 
      name: subjectName.trim(), 
      description: `Course material for ${subjectName}`,
      paper_number: parseInt(paperNumber) || 1
    }])
    .select()

  if (subErr) throw new Error(`Insert Subject Error: ${subErr.message}`)
  subjectCache[key] = newSub[0].id
  return newSub[0].id
}

async function getOrCreateTopic(topicName, subjectId) {
  const key = `${topicName.trim().toLowerCase()}-${subjectId}`
  if (topicCache[key]) return topicCache[key]

  let { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .ilike('name', topicName.trim())

  if (error) {
    throw new Error(`getOrCreateTopic Error: ${error.message}`)
  }

  if (data && data.length > 0) {
    topicCache[key] = data[0].id
    return data[0].id
  }

  // Create new topic
  const { data: newTop, error: topErr } = await supabase
    .from('topics')
    .insert([{ 
      subject_id: subjectId,
      name: topicName.trim(),
      description: `Syllabus topic: ${topicName}`
    }])
    .select()

  if (topErr) throw new Error(`Insert Topic Error: ${topErr.message}`)
  topicCache[key] = newTop[0].id
  return newTop[0].id
}

const BATCH_SIZE = 500;

async function run() {
  const files = [
    'd:\\AI\\fcps\\FCPS_MCQs_5000_Batch.xlsx',
    'd:\\AI\\fcps\\FCPS_MCQs_Batch1_1000.xlsx',
    'd:\\AI\\fcps\\FCPS_MCQs_Batch1_2000.xlsx'
  ]

  let totalSuccess = 0
  let totalErrors = 0

  for (const file of files) {
    console.log(`\n\n--- Processing ${file} ---`)
    
    // Read Excel
    const workbook = xlsx.readFile(file)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data = xlsx.utils.sheet_to_json(sheet)
    
    console.log(`Found ${data.length} rows to process.`)

    console.log(`Resolving Subjects & Topics...`);
    try {
        for (const row of data) {
            if (!row.Question || !row.Subject) continue;
            await getOrCreateSubject(row.Subject, row['Paper Number'])
        }
        for (const row of data) {
            if (!row.Question || !row.Subject) continue;
            const subjectId = subjectCache[row.Subject.trim().toLowerCase()];
            if(subjectId) await getOrCreateTopic(row.Topic, subjectId)
        }
    } catch (e) {
        console.error("FATAL RESOLUTION ERROR:", e.message)
        continue;
    }

    // Prepare payload batch
    console.log(`Preparing bulk insert payload...`)
    let currentBatch = []
    
    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        if (!row.Question || !row.Subject) continue; 

        const subjectKey = row.Subject.trim().toLowerCase()
        const subjectId = subjectCache[subjectKey]
        const topicKey = `${row.Topic.trim().toLowerCase()}-${subjectId}`
        const topicId = topicCache[topicKey]

        const mcqPayload = {
            subject_id: subjectId,
            topic_id: topicId,
            paper_number: parseInt(row['Paper Number']) || 1,
            question: String(row.Question).trim(),
            option_a: String(row['Option A']).trim(),
            option_b: String(row['Option B']).trim(),
            option_c: String(row['Option C']).trim(),
            option_d: String(row['Option D']).trim(),
            correct_answer: String(row['Correct Answer']).toUpperCase().trim(),
            explanation: row.Explanation ? String(row.Explanation).trim() : 'No explanation provided.',
            difficulty: row.Difficulty ? String(row.Difficulty).toLowerCase().trim() : 'medium',
            reference_book: row['Reference Book'] ? String(row['Reference Book']).trim() : 'Standard Textbook',
            question_type: 'clinical_scenario',
            is_published: true
        }

        currentBatch.push(mcqPayload)

        if (currentBatch.length >= BATCH_SIZE || i === data.length - 1) {
            console.log(`Inserting batch of ${currentBatch.length}...`);
            const { error } = await supabase.from('mcqs').insert(currentBatch)
            if (error) {
                console.error(`❌ DB Insert Error details:`, error.message)
                totalErrors += currentBatch.length
            } else {
                totalSuccess += currentBatch.length
            }
            currentBatch = [] // reset batch
        }
    }
  }

  console.log(`\n\n🎉 ALL IMPORT COMPLETE! Successfully added ${totalSuccess} MCQs. Failed: ${totalErrors}.`)
  process.exit(0)
}

run()
