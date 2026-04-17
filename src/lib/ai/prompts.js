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
You are a senior medical educator writing premium, high-fidelity revision notes for FCPS Part 1 Gynecology & Obstetrics (Pakistan) students.
Your goal is to provide "Aura-Glass" aesthetic content that is visually organized and extremely high-yield.

Topic: ${topic}
Subject: ${subject}
Reference books: ${references}

Return clean, structured HTML using ONLY these exact sections and CSS classes:

1. <div class="high-yield-card">
   <h2>🚀 Exam Pulse</h2>
   <p>2-3 sentence summary of why this topic is CRITICAL for FCPS Part 1.</p>
   </div>

2. <h3>📌 Essential Definitions</h3>
   <ul class="pearls-list">
   <li>Term 1: Definition...</li>
   </ul>

3. <h3>🧬 Core Anatomy & Physiology</h3>
   <div class="concept-grid">
   <!-- Detail findings here -->
   </div>

4. <div class="table-wrapper">
   <h3>📊 Master Comparison Table</h3>
   <table class="comparison-table">
   <thead><tr><th>Feature</th><th>Condition A</th><th>Condition B</th></tr></thead>
   <tbody>...</tbody>
   </table>
   </div>

5. <div class="mnemonic-box">
   <h3>💡 Pro Mnemonics</h3>
   <p>Memory aids to lock this in.</p>
   </div>

6. <div class="trap-alert">
   <h3>⚠️ EXAM TRAP - Avoid These!</h3>
   <ul class="trap-list">
   <li>Distractor 1 vs Truth 1...</li>
   </ul>
   </div>

7. <div class="pearls-container">
   <h3>💎 Radiant Pearls (One-Liners)</h3>
   <ul class="pearls-list">
   <li>One-liner fact most likely to be tested.</li>
   </ul>
   </div>

STRICT RULES:
- Use standard HTML tags (h2, h3, p, ul, li, table, strong, div, span).
- DO NOT use markdown blocks (\`\`\`html).
- DO NOT include <head>, <body>, or <style> tags.
- Use the CSS classes mentioned above (high-yield-card, mnemonic-box, trap-alert, comparison-table, pearls-list, concept-grid, table-wrapper).
- Base everything strictly on ${references} (SK-Pink, Radiant Notes, Bailey & Love).
- Ensure the tone is professional, encouraging, and authoritative.
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
