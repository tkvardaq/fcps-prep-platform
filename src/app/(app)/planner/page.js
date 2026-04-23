'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  BrainCircuit, 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  GraduationCap,
  Trash2, 
  AlertCircle, 
  X,
  Stethoscope,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import clsx from 'clsx'
import Link from 'next/link'
import { markScheduleComplete, resetUserPlan } from '@/app/actions/study-actions'
import { generateStudyPlan } from '@/app/actions/ai-actions'

export default function PlannerPage() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)
  const [regenerating, setRegenerating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [hasDiagnostic, setHasDiagnostic] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadSchedule()
  }, [weekOffset])

  async function loadSchedule() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7))
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const { count: diagnosticCount } = await supabase
      .from('diagnostic_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    setHasDiagnostic(diagnosticCount > 0)

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
      toast.success('Protocol Objective Achieved')
      setSchedule(prev => prev.map(s => s.id === id ? { ...s, is_completed: true, completed_at: new Date().toISOString() } : s))
    } else {
      toast.error('Synchronization failed.')
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    const toastId = toast.loading('Recalibrating high-yield pathways...')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Session expired'); return }
      
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      
      const result = await generateStudyPlan(
        profile?.exam_date || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
        profile?.daily_study_hours || 4,
        profile?.paper_focus || 'Both Papers',
        [],
        [],
        true
      )

      if (result?.success) {
        toast.success(`Schedule re-initialized: ${result.daysPlanned} days updated.`, { id: toastId })
        loadSchedule()
      } else {
        toast.error(result?.error || 'Recalibration failed', { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Critical Error: ' + err.message, { id: toastId })
    } finally {
      setRegenerating(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    const toastId = toast.loading('Purging protocol history...')
    try {
      const result = await resetUserPlan()
      if (result.success) {
        toast.success('Clinical data purged. Re-diagnostic required.', { id: toastId })
        setShowResetModal(false)
        loadSchedule()
      } else {
        toast.error(result.error || 'Reset aborted', { id: toastId })
      }
    } catch (err) {
      console.error(err)
      toast.error('Error: ' + err.message, { id: toastId })
    } finally {
      setResetting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const startOfWeekDate = new Date()
  startOfWeekDate.setDate(startOfWeekDate.getDate() - startOfWeekDate.getDay() + 1 + (weekOffset * 7))
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeekDate)
    d.setDate(startOfWeekDate.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const totalHoursWeek = schedule.reduce((sum, s) => sum + Number(s.hours_allocated || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary shadow-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar size={20} className="text-primary/40" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 lg:p-16">
      <Toaster richColors position="top-center" />
      <div className="max-w-7xl mx-auto space-y-16">

        {/* Premium Header & Navigation */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-slate-900 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 opacity-40" />
              <Calendar size={36} className="relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.25em] rounded-full shadow-lg">
                  Protocol Design
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Chronometry</span>
              </div>
              <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">Clinical <span className="text-primary">Pathways</span></h1>
              <p className="text-slate-500 font-medium text-lg max-w-xl flex items-center gap-2">
                {!hasDiagnostic 
                  ? 'Complete your clinical baseline to initialize pathways.'
                  : schedule.length > 0 
                    ? <><Sparkles size={18} className="text-amber-400" /> <span className="text-slate-900 font-black">{totalHoursWeek}H</span> allocated for clinical integration this week.</> 
                    : 'System awaiting pathway synthesis.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/80 p-2.5 rounded-[2.5rem] border border-white shadow-xl backdrop-blur-xl">
            <div className="flex items-center">
              <button onClick={() => setWeekOffset(w => w - 1)} className="p-4 hover:bg-slate-50 text-slate-400 rounded-[1.75rem] transition-all hover:text-slate-900"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={() => setWeekOffset(0)} className="px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-50 rounded-[1.75rem] transition-all">Present</button>
              <button onClick={() => setWeekOffset(w => w + 1)} className="p-4 hover:bg-slate-50 text-slate-400 rounded-[1.75rem] transition-all hover:text-slate-900"><ChevronRight className="w-6 h-6" /></button>
            </div>
            
            <div className="h-10 w-px bg-slate-100 mx-1" />

            {schedule.length > 0 && (
              <button 
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-6 py-4 bg-slate-900 text-white rounded-[1.75rem] transition-all hover:scale-[1.05] active:scale-95 shadow-xl flex items-center gap-3 disabled:opacity-50"
              >
                <RefreshCw className={clsx("w-4 h-4", regenerating && "animate-spin")} />
                <span className="text-[10px] font-black uppercase tracking-widest">Recalibrate</span>
              </button>
            )}

            <button 
              onClick={() => setShowResetModal(true)}
              className="p-4 text-slate-300 hover:text-rose-500 rounded-[1.75rem] transition-all"
              title="System Purge"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Weekly Clinical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
          {days.map((dateStr, i) => {
            const dayTasks = schedule.filter(s => s.scheduled_date === dateStr)
            const isToday = dateStr === todayStr
            const dateObj = new Date(dateStr)
            const allDone = dayTasks.length > 0 && dayTasks.every(t => t.is_completed)
            
            return (
              <div key={dateStr} className={clsx(
                "rounded-[3.5rem] border transition-all duration-500 relative flex flex-col min-h-[450px]",
                isToday 
                  ? "border-primary/20 bg-white ring-[16px] ring-primary/5 shadow-2xl scale-[1.03] z-10" 
                  : "border-white/80 bg-white/40 hover:bg-white shadow-sm hover:shadow-xl hover:border-white",
                allDone && !isToday && "opacity-60"
              )}>
                {/* Day Marker */}
                <div className="px-6 pt-10 pb-6 text-center">
                  <span className={clsx(
                    "block text-[10px] font-black uppercase tracking-[0.3em] mb-4", 
                    isToday ? "text-primary" : "text-slate-400"
                  )}>
                    {dayNames[i]}
                  </span>
                  <div className={clsx(
                    "w-16 h-16 mx-auto rounded-[1.5rem] flex items-center justify-center text-2xl font-display font-black transition-all duration-500",
                    isToday ? "bg-slate-900 text-white shadow-2xl scale-110" : "bg-slate-50 text-slate-900"
                  )}>
                    {dateObj.getDate()}
                  </div>
                  {allDone && (
                    <div className="mt-4 flex justify-center animate-in zoom-in duration-500">
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                        <CheckCircle2 size={10} /> Completed
                      </div>
                    </div>
                  )}
                </div>

                {/* Protocol Modules */}
                <div className="px-4 pb-10 space-y-4 flex-1">
                  {dayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-[0.05]">
                      <Stethoscope size={40} />
                      <span className="text-[8px] font-black uppercase tracking-widest">No Protocol</span>
                    </div>
                  ) : (
                    dayTasks.map(task => {
                      const bgColors = {
                        'Pathology': 'bg-rose-50/50 border-rose-100/50 text-rose-700',
                        'Anatomy': 'bg-sky-50/50 border-sky-100/50 text-sky-700',
                        'Physiology': 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700',
                        'Gynae': 'bg-pink-50/50 border-pink-100/50 text-pink-700',
                        'Medicine': 'bg-violet-50/50 border-violet-100/50 text-violet-700'
                      }
                      const subjectStyle = bgColors[task.subjects?.name] || 'bg-slate-50/50 border-slate-100 text-slate-700'

                      return (
                        <div key={task.id} className={clsx(
                          "p-6 rounded-[2.25rem] border transition-all duration-500 relative group/task shadow-sm hover:shadow-md",
                          task.is_completed 
                            ? "bg-white border-slate-100 opacity-60" 
                            : subjectStyle
                        )}>
                          <div className="flex flex-col gap-4">
                            <div className="flex items-start justify-between gap-2">
                              <span className="px-2 py-0.5 bg-white/50 rounded-md text-[8px] font-black uppercase tracking-widest opacity-60">
                                {task.task_type}
                              </span>
                              <button 
                                onClick={() => !task.is_completed && handleMarkComplete(task.id)}
                                className="shrink-0 transition-transform active:scale-75"
                              >
                                {task.is_completed 
                                  ? <div className="w-6 h-6 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg"><CheckCircle2 className="w-4 h-4" /></div>
                                  : <div className="w-6 h-6 rounded-xl border-2 border-slate-200 group-hover/task:border-primary/50 transition-colors bg-white shadow-inner" />
                                }
                              </button>
                            </div>
                            
                            <p className={clsx(
                              "font-bold text-[13px] leading-tight tracking-tight",
                              task.is_completed ? "text-slate-400 line-through" : "text-slate-900"
                            )}>
                              {task.topics?.name}
                            </p>
                            
                            <div className="flex items-center justify-between">
                               <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                 <Clock className="w-3 h-3" />
                                 <span>{task.hours_allocated}H Focus</span>
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

        {/* Clinical Synthesis State */}
        {schedule.length === 0 && (
          <div className="glass-card rounded-[4rem] border border-white/80 shadow-2xl p-24 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Stethoscope size={400} />
            </div>
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-8">
              <div className="w-24 h-24 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-500">
                {hasDiagnostic ? <Calendar className="w-12 h-12" /> : <Target className="w-12 h-12 text-primary" />}
              </div>
              
              {!hasDiagnostic ? (
                <>
                  <h2 className="text-5xl font-display font-black text-slate-900 tracking-tight">Clinical <span className="text-primary">Benchmark</span> Required</h2>
                  <p className="text-slate-400 font-medium text-xl leading-relaxed">
                    Personalized high-yield paths require baseline clinical metrics. Initialize your diagnostic profile to proceed.
                  </p>
                  <Link 
                    href="/diagnostic"
                    className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-display font-black hover:scale-[1.05] active:scale-95 transition-all inline-flex items-center gap-4 shadow-2xl tracking-[0.2em] text-xs uppercase"
                  >
                    START ASSESSMENT <ChevronRight className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-5xl font-display font-black text-slate-900 tracking-tight">Generate <span className="text-primary">Clinical Path</span></h2>
                  <p className="text-slate-400 font-medium text-xl leading-relaxed">System ready for synthesis. Our intelligence engine will now construct your optimized high-yield schedule based on diagnostic performance.</p>
                  <button 
                    onClick={async () => {
                      const toastId = toast.loading('Synthesizing high-yield schedule...')
                      try {
                        const { data: { user } } = await supabase.auth.getUser()
                        if (!user) { toast.error('Session error'); return }
                        const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
                        const result = await generateStudyPlan(
                          profile?.exam_date || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
                          profile?.daily_study_hours || 4,
                          profile?.paper_focus || 'Both Papers',
                          [],
                          []
                        )
                        if (result?.success) {
                          toast.success(`Protocol established: ${result.daysPlanned} days scheduled.`, { id: toastId })
                          loadSchedule()
                        } else {
                          toast.error(result?.error || 'Synthesis failure', { id: toastId })
                        }
                      } catch (err) {
                        console.error(err)
                        toast.error('Critical failure: ' + err.message, { id: toastId })
                      }
                    }}
                    className="bg-primary text-white px-12 py-6 rounded-[2rem] font-display font-black hover:scale-[1.05] active:scale-95 transition-all inline-flex items-center gap-4 shadow-[0_20px_40px_rgba(14,165,233,0.3)] tracking-[0.2em] text-xs uppercase"
                  >
                    INITIALIZE PROTOCOL <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* System Purge Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="bg-white rounded-[4rem] w-full max-w-xl p-14 shadow-2xl border border-white animate-in zoom-in-95 duration-500">
              <div className="flex justify-between items-start mb-10">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center shadow-inner border border-rose-100">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <button onClick={() => !resetting && setShowResetModal(false)} className="p-4 hover:bg-slate-50 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-slate-300 hover:text-slate-900" />
                </button>
              </div>
              
              <h3 className="text-4xl font-display font-black text-slate-900 mb-4 tracking-tight">Clinical <span className="text-rose-500">Purge</span>?</h3>
              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12">
                This action will permanently eliminate your active study pathways and performance analytics. A fresh diagnostic will be mandatory for system re-initialization.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="py-6 bg-slate-50 text-slate-600 rounded-[2rem] font-display font-black hover:bg-slate-100 transition-all disabled:opacity-50 tracking-[0.2em] text-[10px] uppercase"
                >
                  ABORT
                </button>
                <button 
                  onClick={handleReset}
                  disabled={resetting}
                  className="py-6 bg-rose-500 text-white rounded-[2rem] font-display font-black hover:bg-rose-600 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-3 tracking-[0.2em] text-[10px] uppercase"
                >
                  {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'PURGE ALL DATA'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
