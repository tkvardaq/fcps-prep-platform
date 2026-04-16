const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const csvPath = path.join(__dirname, '../fcps_mcqs_final.csv');
const csvFile = fs.readFileSync(csvPath, 'utf8');

const { data: records } = Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true
});

let sql = '';

// 1. Normalize and get Subjects
const subjectsMap = new Map();
const rawSubjects = [...new Set(records.map(r => r.Subject?.trim()).filter(Boolean))];

const normalizedSubjects = [...new Set(rawSubjects.map(s => {
  const lower = s.toLowerCase();
  if (lower.includes('gynaecol') || lower.includes('gynecol') || lower === 'obstetrics' || lower === 'obetrics' || lower === 'obstetric') {
    return 'Gynaecology and Obstetrics';
  }
  return s;
}))];

sql += '-- INSERT SUBJECTS\n';
normalizedSubjects.forEach(s => {
  const paperNum = s === 'Gynaecology and Obstetrics' ? 2 : 1;
  sql += `INSERT INTO subjects (name, paper_number) VALUES ('${s.replace(/'/g, "''")}', ${paperNum}) ON CONFLICT (name) DO NOTHING;\n`;
});

// 2. Normalize and get Topics
sql += '\n-- INSERT TOPICS\n';
const topicSet = new Set();
records.forEach(r => {
  let sub = r.Subject?.trim();
  const lowerSub = sub?.toLowerCase();
  if (lowerSub && (lowerSub.includes('gynaecol') || lowerSub.includes('gynecol') || lowerSub === 'obstetrics' || lowerSub === 'obetrics' || lowerSub === 'obstetric')) {
    sub = 'Gynaecology and Obstetrics';
  }
  
  const topic = r.Topic?.trim();
  if (sub && topic) {
    const key = `${sub}|${topic}`;
    if (!topicSet.has(key)) {
      sql += `INSERT INTO topics (name, subject_id) SELECT '${topic.replace(/'/g, "''")}', id FROM subjects WHERE name = '${sub.replace(/'/g, "''")}' ON CONFLICT (name, subject_id) DO NOTHING;\n`;
      topicSet.add(key);
    }
  }
});

// 3. Insert MCQs
sql += '\n-- INSERT MCQS\n';
records.forEach(r => {
  let sub = r.Subject?.trim();
  const lowerSub = sub?.toLowerCase();
  if (lowerSub && (lowerSub.includes('gynaecol') || lowerSub.includes('gynecol') || lowerSub === 'obstetrics' || lowerSub === 'obetrics' || lowerSub === 'obstetric')) {
    sub = 'Gynaecology and Obstetrics';
  }

  const topic = r.Topic?.trim();
  const rawQuestion = r.Question?.trim() || '';
  
  // Sanitization: Fix common typos in questions and options
  const sanitize = (text) => {
    if (!text) return '';
    return text
      .replace(/Oxytoxin/gi, 'Oxytocin')
      .replace(/Obetrics/gi, 'Obstetrics')
      .replace(/Gynaecolgy/gi, 'Gynaecology')
      .replace(/'/g, "''");
  };

  const question = sanitize(rawQuestion);
  const optA = sanitize(r['Option A']);
  const optB = sanitize(r['Option B']);
  const optC = sanitize(r['Option C']);
  const optD = sanitize(r['Option D']);
  
  const explanation = sanitize(r.Explanation);
  const reference = sanitize(r['Reference Book']);
  const difficulty = (r.Difficulty || 'medium').toLowerCase();
  const correct = r['Correct Answer']?.trim().toUpperCase();
  
  // Logical Paper mapping: Gynae/Obs core is Paper 2. Basic sciences is Paper 1.
  let paper = parseInt(r['Paper Number']);
  if (!paper) {
    const subLower = sub.toLowerCase();
    if (subLower.includes('gynaecology') || subLower.includes('obstetrics')) {
      // Check topic for basic science keywords
      const topicLower = topic?.toLowerCase() || '';
      if (topicLower.includes('anatomy') || topicLower.includes('embryology') || topicLower.includes('physiology') || topicLower.includes('pharmaco')) {
        paper = 1;
      } else {
        paper = 2;
      }
    } else {
      paper = 1;
    }
  }

  if (sub && topic && question && correct) {
    sql += `INSERT INTO mcqs (subject_id, topic_id, paper_number, question, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, reference_book) 
SELECT s.id, t.id, ${paper}, '${question}', '${optA}', '${optB}', '${optC}', '${optD}', '${correct}', '${explanation}', '${difficulty}', '${reference}'
FROM subjects s
JOIN topics t ON t.subject_id = s.id
WHERE s.name = '${sub.replace(/'/g, "''")}' AND t.name = '${topic.replace(/'/g, "''")}';\n`;
  }
});

fs.writeFileSync(path.join(__dirname, '../migration.sql'), sql, 'utf8');
console.log('SQL file generated: migration.sql');
