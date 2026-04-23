'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  BrainCircuit, 
  PlayCircle, 
  Clock, 
  ArrowRight, 
  Zap, 
  Target, 
  ChevronRight, 
  Activity,
  ShieldCheck,
  ZapOff,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  History
} from 'lucide-react'
import clsx from 'clsx'

export default function RevisionPage() {
  const [dueItems, setDueItems] = useState([])
  const [retentionRate, setRetentionRate] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const [currentTime, setCurrentTime] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line
    setCurrentTime(Date.now())

    async function loadRevision() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      // Due items
      const { data: due } = await supabase
        .from('revision_queue')
        .select('*, topics(name, subject_id, subjects(name, color_hex))')
        .eq('user_id', user.id)
        .lte('next_review_date', today)
        .order('next_review_date', { ascending: true })

      setDueItems(due || [])

      // All items for retention rate
      const { data: all } = await supabase
        .from('revision_queue')
        .select('ease_factor')
        .eq('user_id', user.id)

      setTotalItems(all?.length || 0)

      if (all && all.length > 0) {
        const avgEase = all.reduce((s, r) => s + Number(r.ease_factor), 0) / all.length
        const rate = Math.min(98, Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 60 + 40))
        setRetentionRate(rate)
      }

      setLoading(false)
    }

    loadRevision()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
        <div className="relative">
          <div className="w-24 h-24 border-[6px] border-primary/10 border-t-primary rounded-[2.5rem] animate-[spin_1.5s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit size={32} className="text-primary animate-pulse" />
          </div>
        </div>
        <div className="mt-10 text-center space-y-2">
          <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Loading Neural State</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Scanning Spaced Repetition Queue</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] selection:bg-primary/10 font-sans pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 space-y-12">
        
        {/* Premium Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 bg-white p-10 rounded-[4rem] shadow-sm border border-slate-200/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -mr-64 -mt-64" />
          
          <div className="flex items-center gap-10 relative z-10">
            <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 opacity-50" />
              <BrainCircuit size={40} className="relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.25em] rounded-full shadow-lg">
                  Memory Protocol
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Active Retention Monitoring</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight">Cognitive <span className="text-primary">Revision</span></h1>
              <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">
                Scientific reinforcement based on the SM-2 algorithm. Targeting concepts at their optimal recall window.
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4 relative z-10">
            <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Session Readiness</span>
              <span className="text-2xl font-display font-black text-slate-900">{dueItems.length > 0 ? 'Optimal' : 'Saturated'}</span>
            </div>
          </div>
        </header>

        {/* Analytics Hub */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Pending Reviews', value: dueItems.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', sub: 'Actionable Items' },
            { label: 'Total Engrams', value: totalItems, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50', sub: 'Tracked Concepts' },
            { label: 'Retention rate', value: `${retentionRate}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Memory Stability' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-10 rounded-[3.5rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700">
                <stat.icon size={120} />
              </div>
              <div className={`${stat.bg} ${stat.color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon size={32} />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-display font-black text-slate-900 tracking-tighter">{stat.value}</p>
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{stat.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Priority Queue Area */}
        {dueItems.length > 0 ? (
          <section className="bg-white rounded-[4rem] shadow-sm border border-slate-200/60 overflow-hidden relative">
            <div className="p-10 md:p-14 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Reinforcement Queue</h2>
                <p className="text-slate-500 font-medium mt-1">Modules identified for priority clinical consolidation</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 rounded-2xl border border-primary/10">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Priority Ranking Active</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-50">
              {dueItems.map(item => {
                const daysSinceLast = item.last_reviewed_at && currentTime
                  ? Math.floor((currentTime - new Date(item.last_reviewed_at).getTime()) / (1000*60*60*24))
                  : null

                return (
                  <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-10 hover:bg-slate-50/50 transition-all duration-300 group">
                    <div className="flex items-center gap-10">
                      <div className="relative">
                        <div className="w-4 h-20 rounded-full bg-slate-100 group-hover:h-24 transition-all duration-500" />
                        <div 
                          className="absolute inset-0 w-4 h-full rounded-full transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" 
                          style={{ backgroundColor: item.topics?.subjects?.color_hex || '#8B5CF6' }}
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="px-4 py-1 bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 rounded-xl shadow-sm">
                            {item.topics?.subjects?.name}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                             <Calendar size={12} />
                             {new Date(item.next_review_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-display font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">
                          {item.topics?.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          {item.last_accuracy !== null && (
                            <span className={clsx(
                              "flex items-center gap-2 px-3 py-1.5 rounded-lg border",
                              Number(item.last_accuracy) >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-600 bg-amber-50 border-amber-100'
                            )}>
                              <Activity size={12} /> Accuracy: {item.last_accuracy}%
                            </span>
                          )}
                          <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                            <Zap size={12} className="text-primary" /> Decay: {Number(item.ease_factor).toFixed(1)}
                          </span>
                          {daysSinceLast !== null && (
                            <span className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                              <History size={12} /> Gap: {daysSinceLast}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link 
                      href={`/quiz?topic=${item.topic_id}`}
                      className="mt-8 md:mt-0 flex items-center gap-6 bg-slate-900 text-white pl-10 pr-8 py-5 rounded-[2.5rem] font-display font-black hover:scale-[1.05] active:scale-95 transition-all shadow-xl hover:shadow-slate-900/20 group-hover:bg-primary group-hover:shadow-primary/20"
                    >
                      <span className="uppercase tracking-[0.2em] text-[11px]">Initialize Neural Review</span>
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                        <PlayCircle size={28} />
                      </div>
                    </Link>
                  </div>
                )
              })}
            </div>
          </section>
        ) : totalItems > 0 ? (
          <div className="bg-white rounded-[5rem] border border-slate-200/60 shadow-sm p-24 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
              <ZapOff size={600} />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-sm border border-emerald-100 ring-8 ring-emerald-50 group-hover:rotate-12 transition-transform duration-500">
                <Target size={64} />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tight">Synaptic <span className="text-emerald-500">Harmony</span></h2>
                <p className="text-slate-500 font-medium text-xl leading-relaxed">
                  All high-yield items are currently reinforced within their optimal recall windows. Your neural retention index is at peak performance.
                </p>
              </div>
              <Link href="/subjects" className="inline-flex items-center gap-6 bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-display font-black hover:scale-105 active:scale-95 transition-all shadow-2xl tracking-[0.2em] text-[11px] uppercase">
                Explore Clinical Modules <ChevronRight size={20} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[5rem] border border-slate-200/60 shadow-sm p-24 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
              <BrainCircuit size={600} />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <div className="w-32 h-32 bg-slate-50 text-slate-300 rounded-[3rem] flex items-center justify-center mx-auto shadow-sm border border-slate-100 ring-8 ring-slate-50">
                <BrainCircuit size={64} />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tight">Queue <span className="text-primary">Standoff</span></h2>
                <p className="text-slate-500 font-medium text-xl leading-relaxed">
                  The retention engine requires initial practice data to calculate decay vectors. Complete your first practice session to initialize the protocol.
                </p>
              </div>
              <Link href="/quiz" className="inline-flex items-center gap-6 bg-primary text-white px-12 py-6 rounded-[2.5rem] font-display font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/20 tracking-[0.2em] text-[11px] uppercase">
                Initialize Evaluation <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
