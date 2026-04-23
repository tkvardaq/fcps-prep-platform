'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const progressSchema = z.object({
  mcqId: z.string().uuid(),
  quality: z.number().min(0).max(5),
  isCorrect: z.boolean().optional(),
  timeTaken: z.number().optional(),
})

export async function getPracticeQuestions(subjectIds, cursor = 0, limit = 20) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('mcqs')
      .select('*, user_bookmarks(question_id)')
      .eq('is_published', true)
      .range(cursor, cursor + limit - 1)

    if (subjectIds && subjectIds.length > 0) {
      query = query.in('subject_id', subjectIds)
    }

    const { data, error } = await query
    if (error) throw error

    return { success: true, data }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

export async function updateProgress(payload) {
  const validated = progressSchema.safeParse(payload)
  if (!validated.success) return { success: false, message: 'Invalid data' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { mcqId, quality, isCorrect, timeTaken } = validated.data

  try {
    // 1. Insert into user_attempts (is_correct derived from quality if not provided)
    const correct = typeof isCorrect === 'boolean' ? isCorrect : quality >= 3
    await supabase
      .from('user_attempts')
      .insert({
        user_id: user.id,
        mcq_id: mcqId,
        is_correct: correct,
        time_taken_seconds: timeTaken || null,
      })

    // 2. Call SM-2 RPC to update spaced repetition state
    const { error } = await supabase.rpc('update_sm2_state', {
      p_user_id: user.id,
      p_question_id: mcqId,
      p_quality: quality,
    })
    if (error) throw error

    return { success: true, message: 'Progress updated' }
  } catch (err) {
    return { success: false, message: err.message }
  }
}
