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

export const getStudyPlanPrompt = (date, hours, focus, weakSubjects, strongSubjects, availableSubjects) => `
Create a day-by-day FCPS Part 1 Gynae/Obs study schedule.

Student details:
- Exam date: ${date}
- Study hours per day: ${hours}
- Paper focus: ${focus}
- Weak subjects (needs 40% more time): ${weakSubjects}
- Strong subjects (can revise faster): ${strongSubjects}
- Available subjects to choose from ONLY (DO NOT MAKE UP OTHERS): ${availableSubjects}

Rules:
- First 60% of days: learning phase (cover all topics systematically)
- Next 25% of days: revision phase (spaced repetition)
- Last 15% of days: mock exam phase only (no new topics)
- Sundays: always mock exam day
- Weak subjects appear more frequently throughout
- Interleave Paper 1 and Paper 2 subjects (don't do all of one paper first)

Return ONLY valid JSON array. Each object:
{"date":"YYYY-MM-DD","subject_name":"","topic_name":"","task_type":"learn|revise|mock","hours_allocated":4,"paper_number":1}
`
