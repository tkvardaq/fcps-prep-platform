const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const CSV_FILE = 'd:\\AI\\fcps\\fcps_mcqs_final.csv';

const SUBJECT_ID = 'bcb4ceb9-4528-4cf5-b17c-b4c6dcf3aa8a'; // Gynaecology and Obstetrics

// Mapping of topic names to IDs
const TOPIC_MAPPING = {
  "Abruptio Placentae": "6f8ccb53-a4d7-4f43-af0e-f94e57745850",
  "Amenorrhea": "cc93c13c-33cb-445d-9df8-ff1a36d3ab46",
  "Anemia in Pregnancy": "2432ddb0-e30d-4543-a4c5-ed1a59d0b337",
  "Antenatal Care": "5529aa38-b1b2-4e37-81b0-25adee7c6a1f",
  "Antepartum Hemorrhage": "537cfbe7-fa49-48bb-b147-7e12bae773a0",
  "Biophysical Profile": "e1333100-dea7-49d5-ad3e-f98aab0122db",
  "Biostatistics": "3095c076-fa71-48f9-8952-eabcf97cf299",
  "Cervical Cancer": "b8124174-26b7-424a-bb7d-b16b37969ae0",
  "Cesarean Section": "3f991ae6-f5e5-45c0-bcae-defa605d140e",
  "Diabetes in Pregnancy": "24c7ef13-e21b-4af0-82f5-f1db8c646eef",
  "Drugs in Pregnancy": "4b5ebfb9-5621-479e-aa30-133b37a13f6a",
  "Eclampsia": "582bfb86-244b-48a2-82b6-57e6fcc7bcf4",
  "Endometrial Hyperplasia": "e9dc3eb7-b0e0-4381-8320-2d5023ffae49",
  "Fetal Growth Restriction": "8f9959d7-cb82-4988-a157-1df92b720ef9",
  "Fetal Monitoring": "3d6faad1-ad3a-4f62-aa90-9f959eb7c89a",
  "Gestational Hypertension": "800a72b9-6997-4483-a670-2669adb079b4",
  "Heart Disease in Pregnancy": "e8c8f252-022d-49d3-a194-c9b9591bf061",
  "HELLP Syndrome": "fb5b468c-be2f-48f1-ba6a-80efa919babe",
  "Induction of Labor": "75cc659c-4077-4c87-a34e-77098d401e38",
  "Instrumental Deliveries": "2d027121-c204-4f16-9ede-8feaa2558e26",
  "Jaundice": "809d4ca9-b26e-4faa-8138-42113bd0e575",
  "Lactation": "a4a0dcc5-b2ac-4f6b-8cf5-9a81117182d7",
  "Malpresentations": "2fa4a00b-9efa-435e-920a-b1879b08b797",
  "Mastitis": "34cb726a-a585-422e-be80-454e04448fc0",
  "Maternal Nutrition": "7230848c-9716-4030-96f8-6bf5a9f80b89",
  "Mechanism of Normal Labor": "24655e25-1033-4b73-9161-3b7fc0079115",
  "Menstrual Cycle": "17bcadf7-e881-408b-b6b7-9e22559bdf3d",
  "Multiple Pregnancy": "4f118a82-d8f2-4018-a50a-6072d09ff145",
  "Neonatal Resuscitation": "e22623a2-f82c-4acf-ac5b-993227ec2209",
  "Newborn Examination": "9a2eaa45-0d19-4a96-ac38-070981dc66ac",
  "Obstetric Operations": "b872f8b6-d6c8-43b9-80d9-ac7efcc78501",
  "Ovarian Tumors": "34f1ce02-6e43-443a-a782-b11941c288de",
  "Oxytocics": "121f89ce-09d1-4dfc-abdc-c06378906554",
  "Physiological Changes in Pregnancy": "4a44eece-ce99-402f-a2a1-aa7b46412010",
  "Placenta Previa": "f1d6ad8c-2b8a-4c4c-9aee-b955c8d8457e",
  "Postpartum Hemorrhage": "859f46ce-dd19-4f16-968c-601d087d3d71",
  "Pre-eclampsia": "1333a5dc-90c0-4ce1-b6e8-ea7d6dcdfb86",
  "Premature Rupture of Membranes": "e473b792-4e75-4aa9-8e18-1fe2a4e9621a",
  "Preterm Labor": "07ee0723-fd7d-4763-ac81-9b320b9707f7",
  "Puberty": "5edf163b-3974-44a6-80da-9bf3e59e59e0",
  "Puerperium": "690e452c-db42-4f08-8cb8-696b0201f06c",
  "Teratogenicity": "de93d607-0885-40db-8ea8-4f7dac6ca929"
};

function escapeSql(str) {
  if (str === null || str === undefined) return '';
  if (typeof str !== 'string') str = String(str);
  return str.replace(/'/g, "''");
}

function normalizeCorrectAnswer(row) {
  const ans = row['Correct Answer'] || row.correct_answer || '';
  const val = ans.trim().toUpperCase();
  
  if (['A', 'B', 'C', 'D'].includes(val)) return val;
  
  const options = {
    'A': row['Option A'] || row.option_a,
    'B': row['Option B'] || row.option_b,
    'C': row['Option C'] || row.option_c,
    'D': row['Option D'] || row.option_d,
  };
  
  for (const [letter, text] of Object.entries(options)) {
    if (text && text.trim().toUpperCase() === val) {
      return letter;
    }
  }
  
  return val;
}

const mcqs = [];

// 1. Process CSV
console.log('Processing CSV...');
const csvData = fs.readFileSync(CSV_FILE, 'utf8');
const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

parsed.data.forEach((row, index) => {
  let r = { ...row };
  
  // Heuristic for shifted rows
  const exp = (r.Explanation || '').trim().toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(exp) && exp.length === 1) {
    r.Question = (r.Question + ' ' + r['Option A']).trim();
    r['Option A'] = r['Option B'];
    r['Option B'] = r['Option C'];
    r['Option C'] = r['Option D'];
    r['Option D'] = r['Correct Answer'];
    r['Correct Answer'] = r.Explanation;
    r.Explanation = r.Difficulty;
    // Note: Paper Number might still be in the right place or also shifted?
    // Let's assume Paper Number is 2 for Gyn if it's not clearly 1.
  }

  const topicId = TOPIC_MAPPING[r.Topic.trim()] || null;
  const correctAnswer = normalizeCorrectAnswer(r);
  
  // Handle Paper Number
  let paperNumber = parseInt(r['Paper Number']);
  if (isNaN(paperNumber) || ![1, 2].includes(paperNumber)) {
    paperNumber = 2; // Default for Gyn/Obs
  }

  mcqs.push({
    subject_id: SUBJECT_ID,
    topic_id: topicId,
    paper_number: paperNumber,
    question: r.Question,
    option_a: r['Option A'],
    option_b: r['Option B'],
    option_c: r['Option C'],
    option_d: r['Option D'],
    correct_answer: correctAnswer,
    explanation: r.Explanation,
    reference_book: r['Reference Book'],
    quality_score: 1.0,
    is_published: true,
    metadata: { source: 'csv_final_revised', original_row: index + 1 }
  });
});

console.log(`Total MCQs to import: ${mcqs.length}`);

// Generate SQL batches
const BATCH_SIZE = 100;
// Clear old batches if you want, but we just overwrite.
for (let i = 0; i < mcqs.length; i += BATCH_SIZE) {
  const batch = mcqs.slice(i, i + BATCH_SIZE);
  let batchSql = 'INSERT INTO public.mcqs (subject_id, topic_id, paper_number, question, option_a, option_b, option_c, option_d, correct_answer, explanation, reference_book, quality_score, is_published, metadata) VALUES\n';
  
  batchSql += batch.map(m => `(
    '${m.subject_id}', 
    ${m.topic_id ? `'${m.topic_id}'` : 'NULL'}, 
    ${m.paper_number},
    '${escapeSql(m.question)}', 
    '${escapeSql(m.option_a)}', 
    '${escapeSql(m.option_b)}', 
    '${escapeSql(m.option_c)}', 
    '${escapeSql(m.option_d)}', 
    '${escapeSql(m.correct_answer)}', 
    '${escapeSql(m.explanation)}', 
    '${escapeSql(m.reference_book)}', 
    ${m.quality_score},
    ${m.is_published}, 
    '${escapeSql(JSON.stringify(m.metadata))}'::jsonb
  )`).join(',\n') + ';';
  
  fs.writeFileSync(`d:\\AI\\fcps\\scratch\\batch_${Math.floor(i/BATCH_SIZE)}.sql`, batchSql);
}

console.log('SQL batches generated in scratch directory.');

