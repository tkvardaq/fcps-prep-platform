const fs = require('fs')
const path = require('path')
const Papa = require('papaparse')
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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY in .env.local!")
  process.exit(1)
}

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
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (data) {
    subjectCache[key] = data.id
    return data.id
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
    .single()

  if (subErr) throw subErr
  subjectCache[key] = newSub.id
  return newSub.id
}

async function getOrCreateTopic(topicName, subjectId) {
  const key = `${topicName.trim().toLowerCase()}-${subjectId}`
  if (topicCache[key]) return topicCache[key]

  let { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', subjectId)
    .ilike('name', topicName.trim())
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (data) {
    topicCache[key] = data.id
    return data.id
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
    .single()

  if (topErr) throw topErr
  topicCache[key] = newTop.id
  return newTop.id
}

async function run() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: node scripts/import-mcqs.js <path-to-csv>')
    process.exit(1)
  }

  const csvPath = path.resolve(process.cwd(), fileArg)
  console.log(`Reading CSV from ${csvPath}...`)

  const fileContent = fs.readFileSync(csvPath, 'utf8')

  Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      console.log(`✅ Parsed ${results.data.length} rows. Uploading to Supabase...`)
      let successCount = 0
      let errorCount = 0

      for (const row of results.data) {
        try {
          if (!row.Question || !row.Subject) continue; // skip invalid rows

          // 1. Resolve UUIDs (Auto-create if missing)
          const subjectId = await getOrCreateSubject(row.Subject, row['Paper Number'])
          const topicId = await getOrCreateTopic(row.Topic, subjectId)

          // 2. Insert MCQ
          const mcqPayload = {
            subject_id: subjectId,
            topic_id: topicId,
            paper_number: parseInt(row['Paper Number']) || 1,
            question: row.Question.trim(),
            option_a: row['Option A'].trim(),
            option_b: row['Option B'].trim(),
            option_c: row['Option C'].trim(),
            option_d: row['Option D'].trim(),
            correct_answer: row['Correct Answer'].toUpperCase().trim(),
            explanation: row.Explanation ? row.Explanation.trim() : 'No explanation provided.',
            difficulty: row.Difficulty ? row.Difficulty.toLowerCase().trim() : 'medium',
            reference_book: row['Reference Book'] ? row['Reference Book'].trim() : 'Standard Textbook',
            question_type: 'clinical_scenario',
            is_published: true
          }

          const { error } = await supabase.from('mcqs').insert([mcqPayload])
          if (error) {
            console.error(`❌ DB Insert Error for question "${row.Question.substring(0, 30)}...":`, error.message)
            errorCount++
          } else {
            successCount++
            process.stdout.write(`✅ `)
          }

        } catch (err) {
          console.error(`\n❌ Error processing row:`, err.message)
          errorCount++
        }
      }

      console.log(`\n\n🎉 Import Complete! Successfully added ${successCount} MCQs. Failed: ${errorCount}.`)
    }
  })
}

run()
