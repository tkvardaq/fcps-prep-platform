/**
 * FCPS Platform: MCQ Quality Repair Utility
 * 
 * This script identifies topics where the answer distribution is suspicious 
 * (e.g., all 20 questions have the same correct answer letter) and 
 * provides a way to purge them for re-generation.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function repair() {
  console.log('--- FCPS MCQ Quality Audit ---');
  
  // 1. Get answer distribution per topic
  const { data, error } = await supabase.rpc('get_topic_answer_distribution');
  
  if (error) {
    if (error.code === 'P0001' || error.message.includes('function does not exist')) {
      console.log('Analyzing distribution via query (RPC missing)...');
      await auditViaQuery();
    } else {
      console.error('Error fetching distribution:', error);
    }
    return;
  }
}

async function auditViaQuery() {
  const { data: mcqs, error } = await supabase
    .from('mcqs')
    .select('topic_id, correct_answer');
    
  if (error) {
    console.error('Error loading MCQs:', error);
    return;
  }

  const distribution = {};
  mcqs.forEach(m => {
    if (!distribution[m.topic_id]) distribution[m.topic_id] = { A:0, B:0, C:0, D:0, total:0 };
    distribution[m.topic_id][m.correct_answer]++;
    distribution[m.topic_id].total++;
  });

  const topicsToFix = [];
  for (const tid in distribution) {
    const d = distribution[tid];
    // Criteria for "Suspicious": More than 90% of questions in a topic have the same answer
    const letters = ['A', 'B', 'C', 'D'];
    const dominantLetter = letters.find(l => d[l] / d.total > 0.9);
    
    if (dominantLetter && d.total >= 5) {
      topicsToFix.push({
        id: tid,
        dominant: dominantLetter,
        count: d.total,
        percentage: Math.round((d[dominantLetter] / d.total) * 100)
      });
    }
  }

  console.log(`Found ${topicsToFix.length} topics with suspicious answer distribution (D-bias).`);
  
  if (topicsToFix.length > 0) {
    console.log('\nSuspicious Topics Examples:');
    topicsToFix.slice(0, 10).forEach(t => {
      console.log(`- Topic ID: ${t.id} | Dominant Answer: ${t.dominant} (${t.percentage}%) | Total MCQs: ${t.count}`);
    });
    
    console.log('\nSuggested Action:');
    console.log(`To fix these, run: DELETE FROM mcqs WHERE topic_id IN (${topicsToFix.map(t => `'${t.id}'`).join(',')});`);
    console.log('Then re-seed using the "Seed Initial MCQs" action in the dashboard.');
  } else {
    console.log('All topics look healthy! (Good distribution)');
  }
}

auditViaQuery();
