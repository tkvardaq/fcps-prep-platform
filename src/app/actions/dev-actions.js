'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function clearUserProgress() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  try {
    // Tables to clear for the user
    const tables = [
      'user_attempts',
      'user_sessions',
      'mock_exams',
      'revision_queue',
      'weak_topics',
      'bookmarks',
      'notes',
      'mcq_discussions'
    ]

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', user.id)
      
      if (error) {
        console.error(`Error clearing ${table}:`, error)
      }
    }

    revalidatePath('/')
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
}

export async function syncDatabase() {
  // This is a placeholder for triggering the migration script
  // In a real app, this might trigger a webhook or a background job
  // For now, we'll suggest the user runs the script or we'll provide a feedback message
  return { info: 'Database sync requires server-level permissions. Please contact administrator or run scripts/import-mcqs.js' }
}
