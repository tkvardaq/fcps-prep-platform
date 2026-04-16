'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateSM2 } from '@/lib/study/spaced-repetition'
import { generateContent } from '@/lib/ai/service'

/**
 * Record a complete quiz session — saves user_attempts, user_sessions,
 * updates SM-2 revision queue, weak_topics, and leaderboard.
 */
export async function recordQuizSession({ topicId, subjectId, detailedAttempts, durationMinutes }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // 1. Create session record
  const correctCount = detailedAttempts.filter(a => a.selectedAnswer === a.correctAnswer).length
  const totalQuestions = detailedAttempts.length
  
  const { data: session, error: sessionErr } = await supabase
    .from('user_sessions')
    .insert({
      user_id: user.id,
      session_type: 'quiz',
      topic_id: topicId || null,
      subject_id: subjectId || null,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      duration_minutes: durationMinutes || null
    })
    .select('id')
    .single()

  if (sessionErr) {
    console.error('[recordQuizSession] session insert error:', sessionErr)
    return { success: false, error: sessionErr.message }
  }

  // 2. Insert individual attempts
  const attemptRows = detailedAttempts.map((att) => ({
    user_id: user.id,
    mcq_id: att.questionId,
    topic_id: att.topicId,
    subject_id: att.subjectId,
    selected_answer: att.selectedAnswer || null,
    is_correct: att.selectedAnswer === att.correctAnswer,
    session_id: session.id
  }))

  const { error: attemptsErr } = await supabase
    .from('user_attempts')
    .insert(attemptRows)

  // 2.1 Log errors specifically for the Error Logbook feature
  const errorRows = detailedAttempts
    .filter(att => att.selectedAnswer !== att.correctAnswer)
    .map(att => ({
      user_id: user.id,
      question_id: att.questionId,
      selected_answer: att.selectedAnswer,
      correct_answer: att.correctAnswer,
      confidence_level: att.confidence || 'medium',
      time_taken: att.timeTaken || 0,
      error_type: att.confidence === 'high' ? 'conceptual' : (att.confidence === 'low' ? 'guessed' : 'careless')
    }))

  if (errorRows.length > 0) {
    await supabase.from('error_log').insert(errorRows)
  }

  if (attemptsErr) {
    console.error('[recordQuizSession] attempts insert error:', attemptsErr)
  }

  // 3. Update SM-2 Revision Queue
  const accuracy = Math.round((correctCount / totalQuestions) * 100)
  if (topicId) {
    await updateRevisionQueue(user.id, topicId, accuracy)
  }

  // 4. Update weak_topics
  if (topicId && subjectId) {
    await updateWeakTopics(user.id, topicId, subjectId, accuracy)
  }

  // 5. Update leaderboard
  await updateLeaderboard(user.id)

  return { 
    success: true, 
    success: true, 
    score: correctCount, 
    total: totalQuestions, 
    accuracy,
    sessionId: session.id 
  }
}

/**
 * Record a mock exam result — saves to mock_exams, user_sessions, and user_attempts
 */
export async function recordMockExamResult({ questions, userAnswers, paperNumber, timeTakenMinutes }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Calculate per-subject breakdown
  const subjectMap = {}
  let totalCorrect = 0

  questions.forEach((q, idx) => {
    const subName = q.subjects?.name || 'Unknown'
    if (!subjectMap[subName]) subjectMap[subName] = { total: 0, correct: 0 }
    subjectMap[subName].total++
    const isCorrect = userAnswers[idx] === q.correct_answer
    if (isCorrect) {
      subjectMap[subName].correct++
      totalCorrect++
    }
  })

  const subjectBreakdown = Object.entries(subjectMap).map(([name, vals]) => ({
    name,
    total: vals.total,
    correct: vals.correct,
    accuracy: Math.round((vals.correct / vals.total) * 100)
  }))

  // Identify weak areas (< 60% accuracy)
  const weakAreas = subjectBreakdown.filter(s => s.accuracy < 60)
  const scorePercent = Math.round((totalCorrect / questions.length) * 100)

  // 1. Save to mock_exams
  const { error: mockErr } = await supabase.from('mock_exams').insert({
    user_id: user.id,
    paper_number: paperNumber || 1,
    total_questions: questions.length,
    correct_answers: totalCorrect,
    score_percent: scorePercent,
    time_taken_minutes: timeTakenMinutes,
    subject_breakdown_json: subjectBreakdown,
    weak_areas_json: weakAreas
  })

  if (mockErr) console.error('[recordMockExamResult] mock insert error:', mockErr)

  // 2. Save session
  await supabase.from('user_sessions').insert({
    user_id: user.id,
    session_type: 'mock',
    total_questions: questions.length,
    correct_answers: totalCorrect,
    duration_minutes: timeTakenMinutes
  })

  // 3. Save individual attempts
  const attemptRows = questions.map((q, idx) => ({
    user_id: user.id,
    mcq_id: q.id,
    topic_id: q.topic_id,
    subject_id: q.subject_id,
    selected_answer: userAnswers[idx] || null,
    is_correct: userAnswers[idx] === q.correct_answer
  }))

  await supabase.from('user_attempts').insert(attemptRows)

  // 4. Update leaderboard
  await updateLeaderboard(user.id)

  return {
    success: true,
    score: totalCorrect,
    total: questions.length,
    accuracy: scorePercent,
    subjectBreakdown,
    weakAreas
  }
}

/**
 * Record diagnostic results — saves to diagnostic_results, seeds weak_topics
 */
export async function recordDiagnosticResult({ questions, answers }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Group results by subject
  const subjectMap = {}
  questions.forEach((q, i) => {
    const sid = q.subject_id
    if (!subjectMap[sid]) subjectMap[sid] = { total: 0, correct: 0, topics: {} }
    subjectMap[sid].total++
    const isCorrect = answers[q.id] === q.correct_answer
    if (isCorrect) subjectMap[sid].correct++

    // Track per-topic
    const tid = q.topic_id
    if (!subjectMap[sid].topics[tid]) subjectMap[sid].topics[tid] = { total: 0, correct: 0 }
    subjectMap[sid].topics[tid].total++
    if (isCorrect) subjectMap[sid].topics[tid].correct++
  })

  // Save diagnostic results per subject
  const diagRows = Object.entries(subjectMap).map(([sid, vals]) => ({
    user_id: user.id,
    subject_id: sid,
    score_percent: Math.round((vals.correct / vals.total) * 100)
  }))

  await supabase.from('diagnostic_results').insert(diagRows)

  // Seed weak_topics (subjects < 60%)
  const weakRows = []
  Object.entries(subjectMap).forEach(([sid, vals]) => {
    Object.entries(vals.topics).forEach(([tid, topicVals]) => {
      const acc = Math.round((topicVals.correct / topicVals.total) * 100)
      if (acc < 70) {
        weakRows.push({
          user_id: user.id,
          topic_id: tid,
          subject_id: sid,
          accuracy_percent: acc,
          attempt_count: topicVals.total
        })
      }
    })
  })

  if (weakRows.length > 0) {
    await supabase.from('weak_topics').insert(weakRows)
  }

  // Create session
  const totalCorrect = Object.values(subjectMap).reduce((s, v) => s + v.correct, 0)
  await supabase.from('user_sessions').insert({
    user_id: user.id,
    session_type: 'diagnostic',
    total_questions: questions.length,
    correct_answers: totalCorrect
  })

  return { success: true, subjectResults: diagRows, weakTopicCount: weakRows.length }
}

/**
 * Mark a study schedule item as completed
 */
export async function markScheduleComplete(scheduleId) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('study_schedule')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .eq('user_id', user.id)

  return { success: !error }
}

// ─── Internal Helpers ────────────────────────────────────────

async function updateRevisionQueue(userId, topicId, accuracy) {
  const supabase = await createClient()

  // Check if entry exists
  const { data: existing } = await supabase
    .from('revision_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()

  const sm2 = calculateSM2(
    accuracy,
    existing?.interval_days || 0,
    existing?.ease_factor ? Number(existing.ease_factor) : 2.5,
    existing?.repetition_number || 0
  )

  if (existing) {
    await supabase.from('revision_queue').update({
      next_review_date: sm2.nextReviewDate,
      interval_days: sm2.interval,
      ease_factor: sm2.easeFactor,
      repetition_number: sm2.repetition,
      last_accuracy: accuracy,
      last_reviewed_at: new Date().toISOString()
    }).eq('id', existing.id)
  } else {
    await supabase.from('revision_queue').insert({
      user_id: userId,
      topic_id: topicId,
      next_review_date: sm2.nextReviewDate,
      interval_days: sm2.interval,
      ease_factor: sm2.easeFactor,
      repetition_number: sm2.repetition,
      last_accuracy: accuracy,
      last_reviewed_at: new Date().toISOString()
    })
  }
}

async function updateWeakTopics(userId, topicId, subjectId, accuracy) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('weak_topics')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single()

  if (accuracy < 70) {
    if (existing) {
      const trend = accuracy > Number(existing.accuracy_percent) ? 'improving'
        : accuracy < Number(existing.accuracy_percent) ? 'worsening' : 'stable'
      await supabase.from('weak_topics').update({
        accuracy_percent: accuracy,
        attempt_count: (existing.attempt_count || 0) + 1,
        trend,
        last_updated: new Date().toISOString()
      }).eq('id', existing.id)
    } else {
      await supabase.from('weak_topics').insert({
        user_id: userId,
        topic_id: topicId,
        subject_id: subjectId,
        accuracy_percent: accuracy,
        attempt_count: 1
      })
    }
  } else if (existing) {
    // If user improved past 70%, remove from weak topics
    await supabase.from('weak_topics').delete().eq('id', existing.id)
  }
}

async function updateLeaderboard(userId) {
  const supabase = await createClient()

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  // Get overall stats
  const { count: totalMcqs } = await supabase
    .from('user_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: correctMcqs } = await supabase
    .from('user_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_correct', true)

  // Weekly stats
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count: weeklyMcqs } = await supabase
    .from('user_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('timestamp', weekAgo.toISOString())

  const { count: weeklyCorrect } = await supabase
    .from('user_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_correct', true)
    .gte('timestamp', weekAgo.toISOString())

  const overallAcc = totalMcqs > 0 ? Math.round((correctMcqs / totalMcqs) * 100) : 0
  const weeklyAcc = weeklyMcqs > 0 ? Math.round((weeklyCorrect / weeklyMcqs) * 100) : 0

  // Upsert leaderboard entry
  const { data: existing } = await supabase
    .from('leaderboard_cache')
    .select('id')
    .eq('user_id', userId)
    .single()

  const row = {
    user_id: userId,
    full_name: profile?.full_name || 'Anonymous',
    total_mcqs_attempted: totalMcqs || 0,
    overall_accuracy: overallAcc,
    weekly_mcqs: weeklyMcqs || 0,
    weekly_accuracy: weeklyAcc,
    rank: 0, // Will be recalculated
    updated_at: new Date().toISOString()
  }

  if (existing) {
    await supabase.from('leaderboard_cache').update(row).eq('id', existing.id)
  } else {
    await supabase.from('leaderboard_cache').insert(row)
  }

  // Recalculate ranks for all users
  const { data: allUsers } = await supabase
    .from('leaderboard_cache')
    .select('id, total_mcqs_attempted, overall_accuracy')
    .order('total_mcqs_attempted', { ascending: false })

  if (allUsers) {
    for (let i = 0; i < allUsers.length; i++) {
      await supabase.from('leaderboard_cache').update({ rank: i + 1 }).eq('id', allUsers[i].id)
    }
  }
}

/**
 * Fetch detailed performance analytics for the dashboard
 */
export async function getAnalyticsData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // 1. Accuracy Trend (Last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: trendDataRaw } = await supabase
      .from('user_attempts')
      .select('timestamp, is_correct')
      .eq('user_id', user.id)
      .gte('timestamp', sevenDaysAgo.toISOString())
      .order('timestamp', { ascending: true })

    const trendMap = {}
    trendDataRaw?.forEach(att => {
      const day = new Date(att.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
      if (!trendMap[day]) trendMap[day] = { count: 0, correct: 0 }
      trendMap[day].count++
      if (att.is_correct) trendMap[day].correct++
    })

    const trendData = Object.entries(trendMap).map(([day, stats]) => ({
      name: day,
      accuracy: Math.round((stats.correct / stats.count) * 100)
    }))

    // 2. Topic Mastery (Success rate by subject)
    const { data: masteryRaw } = await supabase
      .from('user_attempts')
      .select('is_correct, subjects(name)')
      .eq('user_id', user.id)

    const masteryMap = {}
    masteryRaw?.forEach(att => {
      const subName = att.subjects?.name || 'Misc'
      if (!masteryMap[subName]) masteryMap[subName] = { count: 0, correct: 0 }
      masteryMap[subName].count++
      if (att.is_correct) masteryMap[subName].correct++
    })

    const masteryData = Object.entries(masteryMap)
      .map(([name, stats]) => ({
        subject: name,
        score: Math.round((stats.correct / stats.count) * 100)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    // 3. Retention (Based on SM-2 revision queue)
    const { data: queue } = await supabase
      .from('revision_queue')
      .select('ease_factor')
      .eq('user_id', user.id)

    let retention = 0
    if (queue && queue.length > 0) {
      // Simple proxy: Average ease factor relative to 2.5 standard
      const avgEase = queue.reduce((acc, curr) => acc + Number(curr.ease_factor), 0) / queue.length
      retention = Math.min(100, Math.round((avgEase / 2.5) * 85)) // Max ~100%
    }

    return {
      trendData: trendData || [],
      masteryData: masteryData || [],
      retention: retention || 0
    }
  } catch (error) {
    console.error('[getAnalyticsData] Error:', error)
    return { trendData: [], masteryData: [], retention: 0 }
  }
}

/**
 * Generate AI explanation for a specific question
 */
export async function generateExplanation(questionId) {
  const supabase = await createClient()
  
  // Get question details
  const { data: question } = await supabase
    .from('mcqs')
    .select('*, subjects(name), topics(name)')
    .eq('id', questionId)
    .single()

  if (!question) return { explanation_correct: "Explanation unavailable.", key_takeaway: "" }

  const prompt = `
    Subject: ${question.subjects?.name}
    Topic: ${question.topics?.name}
    Question: ${question.question}
    Options: A) ${question.option_a}, B) ${question.option_b}, C) ${question.option_c}, D) ${question.option_d}
    Correct Answer: ${question.correct_answer}
    
    Task: Provide a concise, high-yield explanation for the correct answer and briefly mention why common distractors are wrong. 
    Use a professional medical tone suitable for FCPS preparation.
    
    Return EXACTLY a JSON object with this format:
    {"explanation_correct": "detailed text explaining the logic", "key_takeaway": "one sentence summarizing the most important fact to remember"}
  `

  const result = await generateContent({
    cacheKey: `explanation-${questionId}`,
    type: 'notes',
    prompt,
    jsonMode: true
  })

  return result
}

/**
 * Generate a medical mnemonic for a topic or fact
 */
export async function generateMnemonic(text) {
  const prompt = `
    Context: Medical entrance exam (FCPS Part 1)
    Target Fact: ${text}
    
    Task: Create a memorable, creative mnemonic for this fact. 
    Format: The mnemonic phrase followed by what each letter stands for.
    
    Return EXACTLY a JSON object with this format:
    {"mnemonic": "your acronym or phrase here", "breakdown": "what each letter stands for"}
  `

  const result = await generateContent({
    cacheKey: `mnemonic-${Buffer.from(text).toString('base64').substring(0, 50)}`,
    type: 'notes',
    prompt,
    jsonMode: true
  })

  return result
}
