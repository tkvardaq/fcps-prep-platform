'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle2, Circle, Clock, BookOpen, BrainCircuit, Target, ChevronLeft, ChevronRight, Loader2, RefreshCw, GraduationCap } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import clsx from 'clsx'
import Link from 'next/link'
import { markScheduleComplete } from '@/app/actions/study-actions'
import { generateStudyPlan } from '@/app/actions/ai-actions'

export default function PlannerPage() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [regenerating, setRegenerating] = useState(false)
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

  const handleRegenerate = async () => {
    setRegenerating(true)
    const toastId = toast.loading('Regenerating your study plan with updated goals...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Not authenticated'); return }
      
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      
      const result = await generateStudyPlan(
        profile?.exam_date || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
        profile?.daily_study_hours || 4,
        profile?.paper_focus || 'Both Papers',
        [],
        [],
        true // forceRefresh: true
      )

      if (result?.success) {
        toast.success(`Plan updated! ${result.daysPlanned} days re-scheduled.`, { id: toastId })
        loadSchedule()
      } else {
        toast.error(result?.error || 'Failed to update plan', { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Error: ' + err.message, { id: toastId })
    } finally {
      setRegenerating(false)
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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      <Toaster richColors position="top-center" />

      {/* Header with Navigation - "Hub" Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-500 soft-glow-pink">
              <Calendar className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Daily <span className="text-rose-500">Sparkle</span></h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            {schedule.length > 0 
              ? `You've got ${totalHoursWeek}h of medical magic planned this week! ✨` 
              : 'Your future is waiting to be planned...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-3xl card-shadow border border-rose-50">
          <div className="flex items-center">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-3 hover:bg-rose-50 text-rose-400 rounded-2xl transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setWeekOffset(0)} className="px-6 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors">This Week</button>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-3 hover:bg-rose-50 text-rose-400 rounded-2xl transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
          
          {schedule.length > 0 && (
            <div className="h-8 w-px bg-rose-100/50 mx-1" />
          )}

          {schedule.length > 0 && (
            <button 
              onClick={handleRegenerate}
              disabled={regenerating}
              className="p-3 bg-rose-500 text-white rounded-2xl transition-all hover:scale-105 active:scale-95 soft-glow-pink flex items-center gap-2 group disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold hidden sm:inline">Refresh Logic</span>
            </button>
          )}
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {days.map((dateStr, i) => {
          const dayTasks = schedule.filter(s => s.scheduled_date === dateStr)
          const isToday = dateStr === todayStr
          const dateObj = new Date(dateStr)
          const allDone = dayTasks.length > 0 && dayTasks.every(t => t.is_completed)
          
          return (
            <div key={dateStr} className={clsx(
              "rounded-[2.5rem] border transition-all relative group",
              isToday ? "border-rose-200 bg-white ring-4 ring-rose-500/5 soft-glow-pink scale-105 z-10" : "border-slate-100 bg-white/60 hover:bg-white hover:border-rose-100 card-shadow",
              allDone && !isToday && "opacity-80"
            )}>
              {/* Day Header */}
              <div className="px-5 pt-6 pb-2 text-center">
                <span className={clsx("block text-[10px] font-black uppercase tracking-widest mb-1", isToday ? "text-rose-500" : "text-slate-400")}>
                  {dayNames[i]} {isToday && "✨"}
                </span>
                <span className={clsx("text-2xl font-black", isToday ? "text-slate-900" : "text-slate-700")}>
                  {dateObj.getDate()}
                </span>
                {allDone && <div className="mt-1 text-teal-500 text-sm">💖</div>}
              </div>

              {/* Tasks */}
              <div className="p-3 pb-6 space-y-3 min-h-[120px]">
                {dayTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-20">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300" />
                  </div>
                ) : (
                  dayTasks.map(task => {
                    const typeIcon = task.task_type === 'mock' ? Target : task.task_type === 'revise' ? BrainCircuit : BookOpen
                    const TypeIcon = typeIcon
                    
                    // Subject colors mapping
                    const bgColors = {
                      'Pathology': 'bg-pathology',
                      'Anatomy': 'bg-anatomy',
                      'Physiology': 'bg-physiology',
                      'Gynae': 'bg-gynae',
                      'Medicine': 'bg-medicine'
                    }
                    const subjectColor = bgColors[task.subjects?.name] || 'bg-slate-50'

                    return (
                      <div key={task.id} className={clsx(
                        "p-4 rounded-[1.8rem] transition-all duration-500 border group items-center relative tap-shrink",
                        task.is_completed 
                          ? "bg-white border-teal-100 shadow-sm" 
                          : `${subjectColor} border-transparent hover:border-rose-200 shadow-sm hover:shadow-md`
                      )}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className={clsx(
                              "text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full",
                              task.is_completed ? "bg-teal-50 text-teal-600" : "bg-white/60 text-slate-800"
                            )}>
                              {task.task_type}
                            </span>
                            <button 
                              onClick={() => !task.is_completed && handleMarkComplete(task.id)}
                              className="shrink-0"
                            >
                              {task.is_completed 
                                ? <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white"><CheckCircle2 className="w-3.5 h-3.5" /></div>
                                : <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-rose-400 transition-colors" />
                              }
                            </button>
                          </div>
                          
                          <p className={clsx(
                            "font-bold text-xs leading-tight line-clamp-3",
                            task.is_completed ? "text-slate-400 line-through decoration-teal-500/30" : "text-slate-800"
                          )}>
                            {task.topics?.name}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-bold">
                             <div className="flex items-center gap-1">
                               <Clock className="w-3 h-3" />
                               <span>{task.hours_allocated}h</span>
                             </div>
                             {task.is_completed && <span className="text-teal-500">Done! ✨</span>}
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

      {/* Empty State Redesign */}
      {schedule.length === 0 && (
        <div className="bg-white rounded-[3rem] border border-rose-100 card-shadow p-20 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <GraduationCap className="w-64 h-64 text-rose-500" />
          </div>
          <div className="relative z-10 max-w-md mx-auto">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8 soft-glow-pink">
              <Calendar className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Ready to start your <span className="text-rose-500">Journey</span>?</h2>
            <p className="text-slate-500 font-medium mb-10 leading-relaxed">Let our AI build you a beautiful, personalized schedule that fits your life perfectly.</p>
            <button 
              onClick={async () => {
                const toastId = toast.loading('Creating medical magic... ✨')
                try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (!user) { toast.error('Not authenticated'); return }
                  const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
                  const p = profile
                  const result = await generateStudyPlan(
                    p?.exam_date || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
                    p?.daily_study_hours || 4,
                    p?.paper_focus || 'Both Papers',
                    [],
                    []
                  )
                  if (result?.success) {
                    toast.success(`Schedule created! ✨ Days planned: ${result.daysPlanned}`, { id: toastId })
                    loadSchedule()
                  } else {
                    toast.error(result?.error || 'Failed to generate plan', { id: toastId })
                  }
                } catch (err) {
                  console.error(err)
                  toast.error('Error generating plan: ' + err.message, { id: toastId })
                }
              }}
              className="bg-rose-500 text-white px-10 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3 soft-glow-pink shadow-lg shadow-rose-200"
            >
              Generate My Magic Plan ✨
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
