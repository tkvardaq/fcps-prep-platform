/**
 * Database Migration Script: CSV to Supabase
 * Performs a clean wipe and re-imports the verified MCQ dataset.
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('🚀 Starting Database Migration...');

  try {
    // 1. Wipe existing data (Order matters due to FKs)
    console.log('🧹 Wiping existing data...');
    
    // Low-level deletes to be fast
    const tablesToWipe = [
      'user_attempts',
      'user_sessions',
      'mock_exams',
      'revision_queue',
      'weak_topics',
      'bookmarks',
      'notes',
      'mcq_discussions',
      'mcqs',
      'topics',
      'subjects'
    ];

    for (const table of tablesToWipe) {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) {
        console.warn(`⚠️ Warning: Could not wipe ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} wiped.`);
      }
    }

    // 2. Read CSV
    console.log('📖 Reading CSV file...');
    const csvPath = path.join(__dirname, '../fcps_mcqs_final.csv');
    const csvFile = fs.readFileSync(csvPath, 'utf8');
    
    const { data: records, errors } = Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true
    });

    if (errors.length > 0) {
      console.warn('⚠️ CSV Parsing Errors:', errors);
    }

    console.log(`📊 Found ${records.length} records in CSV.`);

    // 3. Process Subjects and Topics first
    const subjectsMap = new Map();
    const topicsMap = new Map();

    console.log('🏗️ Processing Subjects and Topics...');
    
    for (const record of records) {
      const subjectName = record.Subject?.trim();
      const topicName = record.Topic?.trim();

      if (subjectName && !subjectsMap.has(subjectName)) {
        const { data, error } = await supabase
          .from('subjects')
          .insert({ name: subjectName })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error inserting subject ${subjectName}:`, error);
          continue;
        }
        subjectsMap.set(subjectName, data.id);
      }

      const subjectId = subjectsMap.get(subjectName);
      const topicKey = `${subjectId}_${topicName}`;

      if (topicName && subjectId && !topicsMap.has(topicKey)) {
        const { data, error } = await supabase
          .from('topics')
          .insert({ name: topicName, subject_id: subjectId })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error inserting topic ${topicName}:`, error);
          continue;
        }
        topicsMap.set(topicKey, data.id);
      }
    }

    // 4. Batch Insert MCQs
    console.log('📥 Inserting MCQs in batches...');
    const batchSize = 100;
    const mcqsToInsert = [];

    for (const record of records) {
      const subjectId = subjectsMap.get(record.Subject?.trim());
      const topicId = topicsMap.get(`${subjectId}_${record.Topic?.trim()}`);

      if (!subjectId || !topicId) continue;

      mcqsToInsert.push({
        subject_id: subjectId,
        topic_id: topicId,
        paper_number: parseInt(record['Paper Number']) || 1,
        question: record.Question,
        options: [
          record['Option A'],
          record['Option B'],
          record['Option C'],
          record['Option D']
        ],
        correct_answer: record['Correct Answer'], // 'A', 'B', 'C', or 'D'
        explanation: record.Explanation,
        difficulty: (record.Difficulty || 'Medium').charAt(0).toUpperCase() + (record.Difficulty || 'Medium').slice(1).toLowerCase(),
        reference: record['Reference Book']
      });
    }

    for (let i = 0; i < mcqsToInsert.length; i += batchSize) {
      const batch = mcqsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from('mcqs').insert(batch);
      
      if (error) {
        console.error(`❌ Error inserting batch starting at ${i}:`, error);
      } else {
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mcqsToInsert.length / batchSize)}`);
      }
    }

    console.log('🎉 Migration Completed Successfully!');
  } catch (err) {
    console.error('💥 Migration Failed:', err);
  }
}

migrate();
