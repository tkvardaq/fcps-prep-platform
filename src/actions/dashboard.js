'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  try {
    // Fetch main dashboard stats
    const { data, error } = await supabase.rpc('get_dashboard_data', {
      p_user_id: user.id,
    })
    if (error) throw error

    // Fetch today's schedule
    const today = new Date().toISOString().split('T')[0]
    const { data: todaySchedule } = await supabase
      .from('study_schedule')
      .select('*, subjects(name, color_hex), topics(name)')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .order('hours_allocated', { ascending: false })

    return {
      success: true,
      data: {
        ...data,
        today_schedule: todaySchedule || [],
      },
    }
  } catch (err) {
    return { success: false, message: err.message || 'Failed to fetch dashboard' }
  }
}
