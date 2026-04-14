'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle2, Circle, Clock, BookOpen, BrainCircuit, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import Link from 'next/link'
import { markScheduleComplete } from '@/app/actions/study-actions'

export default function PlannerPage() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadSchedule()
  }, [weekOffset])

  async function loadSchedule() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get date range for the current week view
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)) // Monday
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday

    const { data, error } = await supabase
      .from('study_schedule')
      .select('*, subjects(name, color_hex), topics(name)')
      .eq('user_id', user.id)
      .gte('scheduled_date', startOfWeek.toISOString().split('T')[0])
      .lte('scheduled_date', endOfWeek.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .order('hours_allocated', { ascending: false })

    setSchedule(data || [])
    setLoading(false)
  }

  const handleMarkComplete = async (id) => {
    const result = await markScheduleComplete(id)
    if (result.success) {
      toast.success('Marked as complete!')
      setSchedule(prev => prev.map(s => s.id === id ? { ...s, is_completed: true, completed_at: new Date().toISOString() } : s))
    } else {
      toast.error('Failed to update')
    }
  }

  // Group by day
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7))
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const todayStr = new Date().toISOString().split('T')[0]

  const completedToday = schedule.filter(s => s.scheduled_date === todayStr && s.is_completed).length
  const totalToday = schedule.filter(s => s.scheduled_date === todayStr).length
  const totalHoursWeek = schedule.reduce((sum, s) => sum + Number(s.hours_allocated || 0), 0)
  const completedWeek = schedule.filter(s => s.is_completed).length

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toaster richColors position="top-center" />

      {/* Header with Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-2xl border border-slate-100 card-shadow gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Study Planner</h1>
          <p className="text-slate-500">
            {schedule.length > 0 ? `${totalHoursWeek}h planned this week · ${completedWeek}/${schedule.length} tasks done` : 'No study plan yet. Complete onboarding to generate your AI schedule.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
          <button onClick={() => setWeekOffset(0)} className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">This Week</button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {days.map((dateStr, i) => {
          const dayTasks = schedule.filter(s => s.scheduled_date === dateStr)
          const isToday = dateStr === todayStr
          const dateObj = new Date(dateStr)
          
          return (
            <div key={dateStr} className={`rounded-2xl border overflow-hidden transition-all ${isToday ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-100'} bg-white card-shadow`}>
              {/* Day Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${isToday ? 'bg-blue-600 text-white' : 'bg-slate-50'}`}>
                <span className={`font-bold text-sm ${isToday ? 'text-white' : 'text-slate-700'}`}>{dayNames[i]}</span>
                <span className={`text-xs font-bold ${isToday ? 'text-blue-200' : 'text-slate-400'}`}>{dateObj.getDate()}</span>
              </div>

              {/* Tasks */}
              <div className="p-2 space-y-2 min-h-[100px]">
                {dayTasks.length === 0 ? (
                  <p className="text-xs text-slate-300 text-center py-4">No tasks</p>
                ) : (
                  dayTasks.map(task => {
                    const typeIcon = task.task_type === 'mock' ? Target : task.task_type === 'revise' ? BrainCircuit : BookOpen
                    const TypeIcon = typeIcon
                    return (
                      <div key={task.id} className={`p-2.5 rounded-xl text-xs transition-all ${task.is_completed ? 'bg-teal-50 border border-teal-100' : 'bg-slate-50 border border-slate-100 hover:border-blue-200'}`}>
                        <div className="flex items-start gap-2">
                          <button 
                            onClick={() => !task.is_completed && handleMarkComplete(task.id)}
                            className="mt-0.5 shrink-0"
                          >
                            {task.is_completed 
                              ? <CheckCircle2 className="w-4 h-4 text-teal-500" /> 
                              : <Circle className="w-4 h-4 text-slate-300 hover:text-blue-500 transition-colors" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold leading-tight line-clamp-2 ${task.is_completed ? 'text-teal-700 line-through' : 'text-slate-800'}`}>
                              {task.topics?.name}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-slate-400">
                              <TypeIcon className="w-3 h-3" />
                              <span className="capitalize">{task.task_type}</span>
                              <span>·</span>
                              <Clock className="w-3 h-3" />
                              <span>{task.hours_allocated}h</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {schedule.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Study Plan Generated</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Complete the onboarding flow to generate your personalized AI study schedule based on your exam date and weak areas.</p>
          <Link href="/onboarding" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            Generate Study Plan
          </Link>
        </div>
      )}
    </div>
  )
}
