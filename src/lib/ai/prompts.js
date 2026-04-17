export const getMCQPrompt = (topic, subject, paper, references) => `
You are an expert medical educator creating MCQs for the FCPS Part 1 Gynecology & Obstetrics exam in Pakistan.

Generate exactly 20 high-quality MCQs for:
Topic: ${topic}
Subject: ${subject}
Paper: Paper ${paper}
Reference books for this subject: ${references}

Strict rules:
- Single best answer format, exactly 4 options (A/B/C/D)
- Match the difficulty and style of Radiant Notes or SK-Pink
- Paper 1: Focus on pure basic science facts, mechanisms, and pathways
- Paper 2: Include clinical scenario-based questions (patient presents with...)
- Every explanation must cite the underlying concept clearly
- Never repeat questions
- Difficulty distribution: 30% easy, 50% medium, 20% hard
- question_type: 'factual' for direct recall, 'clinical_scenario' for patient cases, 'applied' for mechanism/reasoning questions

CRITICAL QUALITY RULES:
1. RANDOMIZE the correct answer letter (A, B, C, or D). Ensure a roughly even distribution across the 20 questions.
2. DISTRACTORS must be plausible medical findings, not obvious "filler" text.
3. Ensure no two questions are identical in logic.

Return ONLY a valid JSON array. No markdown. No extra text.
Each object must have exactly these fields:
{"question":"","option_a":"","option_b":"","option_c":"","option_d":"","correct_answer":"A","explanation":"","difficulty":"easy","question_type":"factual","reference_book":""}
`

export const getNotesPrompt = (topic, subject, references) => `
You are a senior medical educator writing high-yield revision notes for FCPS Part 1 Gynecology & Obstetrics (Pakistan) students.

Create comprehensive revision notes for:
Topic: ${topic}
Subject: ${subject}
Reference books: ${references}

Structure your notes EXACTLY as follows:
1. OVERVIEW — 2-3 sentence summary of why this topic matters for FCPS
2. KEY DEFINITIONS — bullet list of must-know terms
3. CORE CONCEPTS — the essential facts, mechanisms, pathways
4. COMPARISON TABLES — side-by-side comparisons where relevant
5. MNEMONICS — memory aids for complex lists or sequences
6. EXAM TRAPS — common wrong answers and how to avoid them
7. HIGH-YIELD FACTS — 5-7 one-liner facts most likely to appear in exam
8. CLINICAL LINKS — how basic science connects to clinical Gyne/Obs

Base everything strictly on ${references}. Do not include unverified or speculative information.
Return as clean HTML (use h2, h3, ul, li, table, strong tags only). Do NOT wrap the result in JSON, just return raw HTML.
`

export const getStudyPlanPrompt = (date, hours, focus, weakSubjects, strongSubjects, availableSubjects) => {
  const today = new Date().toISOString().split('T')[0]
  return `Create a 14-day FCPS Part 1 study schedule starting from ${today}.

Student details:
- Exam date: ${date}
- Study hours per day: ${hours}
- Paper focus: ${focus}
- Weak subjects (allocate MORE time): ${weakSubjects || 'None specified'}
- Strong subjects (can revise faster): ${strongSubjects || 'None specified'}
- YOU MUST ONLY USE THESE EXACT SUBJECT NAMES: ${availableSubjects}

CRITICAL RULES:
1. Generate EXACTLY 28 entries (2 per day for 14 days)
2. subject_name MUST be one of the exact names from the available subjects list above
3. Start dates from ${today}, increment by 1 day
4. Days 1-8: task_type = "learn"
5. Days 9-12: task_type = "revise"
6. Days 13-14: task_type = "mock"
7. Distribute weak subjects across MORE days
8. hours_allocated should be ${Math.round(hours/2)} per entry (2 entries per day)

Return ONLY a valid JSON array. No markdown. No extra text.
Each object: {"date":"YYYY-MM-DD","subject_name":"EXACT_NAME","topic_name":"General","task_type":"learn","hours_allocated":${Math.round(hours/2)},"paper_number":1}
`
}
