import { createClient } from '@/lib/supabase/server'

/**
 * Analytics Engine — Central data calculations for the FCPS platform.
 * Every page should use these functions instead of hardcoded values.
 */

/** Get overall subject progress for a user (% accuracy per subject) */
export async function getSubjectProgress(userId) {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('user_attempts')
    .select('subject_id, is_correct, subjects(name, paper_number, color_hex)')
    .eq('user_id', userId)

  if (!data || data.length === 0) return []

  // Group by subject
  const map = {}
  data.forEach(a => {
    if (!map[a.subject_id]) {
      map[a.subject_id] = { 
        subject_id: a.subject_id,
        name: a.subjects?.name,
        paper_number: a.subjects?.paper_number,
        color_hex: a.subjects?.color_hex,
        total: 0, 
        correct: 0 
      }
    }
    map[a.subject_id].total++
    if (a.is_correct) map[a.subject_id].correct++
  })

  return Object.values(map).map(s => ({
    ...s,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }))
}

/** Get Paper Readiness (weighted accuracy across Paper 1 and Paper 2) */
export async function getPaperReadiness(userId) {
  const progress = await getSubjectProgress(userId)
  
  const paper1 = progress.filter(s => s.paper_number === 1)
  const paper2 = progress.filter(s => s.paper_number === 2)

  const calcAvg = (arr) => {
    if (arr.length === 0) return 0
    return Math.round(arr.reduce((sum, s) => sum + s.accuracy, 0) / arr.length)
  }

  const p1Accuracy = calcAvg(paper1)
  const p2Accuracy = calcAvg(paper2)
  const overall = progress.length > 0 ? calcAvg(progress) : 0

  return { paper1: p1Accuracy, paper2: p2Accuracy, overall }
}

/** Get weekly accuracy trend (last 7 days) from user_sessions */
export async function getWeeklyAccuracyTrend(userId) {
  const supabase = await createClient()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data } = await supabase
    .from('user_sessions')
    .select('completed_at, total_questions, correct_answers')
    .eq('user_id', userId)
    .gte('completed_at', sevenDaysAgo.toISOString())
    .order('completed_at', { ascending: true })

  if (!data || data.length === 0) return []

  // Group by date
  const byDate = {}
  data.forEach(s => {
    const day = new Date(s.completed_at).toLocaleDateString('en-US', { weekday: 'short' })
    if (!byDate[day]) byDate[day] = { total: 0, correct: 0 }
    byDate[day].total += s.total_questions
    byDate[day].correct += s.correct_answers
  })

  return Object.entries(byDate).map(([day, vals]) => ({
    day,
    accuracy: vals.total > 0 ? Math.round((vals.correct / vals.total) * 100) : 0,
    mcqs: vals.total
  }))
}

/** Get overall stats KPIs */
export async function getOverallStats(userId) {
  const supabase = await createClient()

  // Total MCQs attempted
  const { count: totalAttempts } = await supabase
    .from('user_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Correct answers
  const { count: correctCount } = await supabase
    .from('user_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_correct', true)

  // Total sessions
  const { count: totalSessions } = await supabase
    .from('user_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Current streak (consecutive days with sessions)
  const { data: sessions } = await supabase
    .from('user_sessions')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(30)

  let streak = 0
  if (sessions && sessions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const uniqueDates = [...new Set(sessions.map(s => {
      const d = new Date(s.completed_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }))].sort((a, b) => b - a)

    // Check if today or yesterday had activity
    const diff = (today.getTime() - uniqueDates[0]) / (1000 * 60 * 60 * 24)
    if (diff <= 1) {
      streak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const gap = (uniqueDates[i - 1] - uniqueDates[i]) / (1000 * 60 * 60 * 24)
        if (gap === 1) streak++
        else break
      }
    }
  }

  // Topics mastered (accuracy >= 80% with at least 10 attempts)
  const { data: topicStats } = await supabase
    .from('user_attempts')
    .select('topic_id, is_correct')
    .eq('user_id', userId)

  let topicsMastered = 0
  if (topicStats) {
    const byTopic = {}
    topicStats.forEach(a => {
      if (!byTopic[a.topic_id]) byTopic[a.topic_id] = { total: 0, correct: 0 }
      byTopic[a.topic_id].total++
      if (a.is_correct) byTopic[a.topic_id].correct++
    })
    topicsMastered = Object.values(byTopic).filter(t => t.total >= 10 && (t.correct / t.total) >= 0.8).length
  }

  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

  return {
    totalAttempts: totalAttempts || 0,
    correctCount: correctCount || 0,
    accuracy,
    totalSessions: totalSessions || 0,
    streak,
    topicsMastered
  }
}

/** Get today's study schedule */
export async function getTodaySchedule(userId) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('study_schedule')
    .select('*, subjects(name, color_hex), topics(name)')
    .eq('user_id', userId)
    .eq('scheduled_date', today)
    .order('hours_allocated', { ascending: false })

  return data || []
}

/** Get retention rate from revision_queue */
export async function getRetentionRate(userId) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('revision_queue')
    .select('ease_factor, repetition_number, last_accuracy')
    .eq('user_id', userId)

  if (!data || data.length === 0) return { rate: 0, dueCount: 0, totalItems: 0 }

  // Retention = average ease_factor mapped to a percentage (1.3 → 40%, 2.5 → 85%, 3.0+ → 95%)
  const avgEase = data.reduce((s, r) => s + Number(r.ease_factor), 0) / data.length
  const rate = Math.min(98, Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 60 + 40))

  // Due items (next_review_date <= today)
  const today = new Date().toISOString().split('T')[0]
  const { count: dueCount } = await supabase
    .from('revision_queue')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_date', today)

  return { rate, dueCount: dueCount || 0, totalItems: data.length }
}

/** Get weak topics for a user */
export async function getWeakTopics(userId) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('weak_topics')
    .select('*, topics(name), subjects(name, color_hex)')
    .eq('user_id', userId)
    .order('accuracy_percent', { ascending: true })
    .limit(5)

  return data || []
}
