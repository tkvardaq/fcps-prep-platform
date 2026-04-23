'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area } from 'recharts'
import { TrendingUp, Target, Activity, BookOpen, Flame, Calendar, ChevronLeft, Info, Sparkles, Zap, Shield, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ProgressPage() {
  const [stats, setStats] = useState(null)
  const [weeklyTrend, setWeeklyTrend] = useState([])
  const [subjectPerf, setSubjectPerf] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProgress()
  }, [])

  async function loadProgress() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count: totalAttempts } = await supabase
      .from('user_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: correctCount } = await supabase
      .from('user_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_correct', true)

    const { count: totalSessions } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0
    const { data: profile } = await supabase.from('user_profiles').select('exam_date').eq('id', user.id).single()

    setStats({
      totalAttempts: totalAttempts || 0,
      accuracy,
      sessions: totalSessions || 0,
      streak: 0,
      topicsMastered: 0,
      examDate: profile?.exam_date
    })

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: recentSessions } = await supabase
      .from('user_sessions')
      .select('completed_at, total_questions, correct_answers')
      .eq('user_id', user.id)
      .gte('completed_at', fourteenDaysAgo.toISOString())
      .order('completed_at', { ascending: true })

    const byDate = {}
    recentSessions?.forEach(s => {
      const day = new Date(s.completed_at).toLocaleDateString('en-US', { weekday: 'short' })
      if (!byDate[day]) byDate[day] = { total: 0, correct: 0 }
      byDate[day].total += s.total_questions
      byDate[day].correct += s.correct_answers
    })

    setWeeklyTrend(Object.entries(byDate).map(([day, v]) => ({
      day,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    })))

    const { data: subAttempts } = await supabase
      .from('user_attempts')
      .select('subject_id, is_correct, subjects(name)')
      .eq('user_id', user.id)

    const bySub = {}
    subAttempts?.forEach(a => {
      if (!bySub[a.subject_id]) bySub[a.subject_id] = { name: a.subjects?.name || 'Unknown', total: 0, correct: 0 }
      bySub[a.subject_id].total++
      if (a.is_correct) bySub[a.subject_id].correct++
    })

    setSubjectPerf(Object.values(bySub).map(s => ({
      name: s.name,
      accuracy: Math.round((s.correct / s.total) * 100),
      total: s.total
    })).sort((a, b) => b.total - a.total))

    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FFFBFB] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full" />
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-blue-100 flex items-center justify-center mb-6 animate-bounce">
          <Activity className="w-10 h-10 text-blue-500" />
        </div>
        <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-[10px]">Synchronizing Clinical Vectors...</p>
      </div>
    </div>
  )

  const hasData = (stats?.totalAttempts || 0) > 0

  return (
    <main className="min-h-screen bg-[#FFFBFB] p-4 md:p-10 lg:p-16 relative overflow-hidden">
      {/* Background Ambient Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sky-400/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        
        {/* Premium Clinical Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-10">
          <div className="space-y-6">
            <Link href="/dashboard" className="inline-flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-[0.25em] group">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </div>
              Back to Nexus
            </Link>
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-none">
                Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Matrix</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">
                Real-time synchronization of clinical proficiency vectors. Data-driven insights to ensure examination readiness.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-2">Target Horizon</span>
              <div className="px-8 py-4 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 font-black text-slate-900 text-sm tracking-widest flex items-center gap-4 group hover:scale-105 transition-transform cursor-pointer">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Calendar className="w-4 h-4" />
                </div>
                {stats?.examDate || 'MISSION TBD'}
              </div>
            </div>
            <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 shadow-lg flex items-center justify-center text-slate-300 hover:text-blue-500 hover:border-blue-100 transition-all cursor-pointer group hover:scale-110">
              <Info className="w-7 h-7 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
        </header>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
          <KPICard icon={Target} label="Neural Index" value={stats?.totalAttempts} color="blue" description="Total MCQs Processed" />
          <KPICard icon={TrendingUp} label="Precision" value={`${stats?.accuracy}%`} color="emerald" description="Average Recall Accuracy" />
          <KPICard icon={Activity} label="Pulse Count" value={stats?.sessions} color="indigo" description="Total Study Sessions" />
          <KPICard icon={Flame} label="Neural Flux" value={`${stats?.streak}d`} color="orange" description="Current Study Streak" />
          <KPICard icon={BookOpen} label="Mastery" value={stats?.topicsMastered} color="violet" description="Topics Optimized" />
        </div>

        {hasData ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Accuracy Trend Chart */}
            <section className="lg:col-span-2 glass-card p-10 md:p-14 rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/50 relative overflow-hidden group transition-all duration-700 hover:shadow-indigo-100">
              <div className="absolute top-0 right-0 p-10 opacity-5 text-slate-900 group-hover:scale-110 transition-transform duration-1000">
                <TrendingUp size={120} />
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Recall Trajectory</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">14-Day Neural Propagation</p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Live Sync Active</span>
                </div>
              </div>
              
              <div className="h-[400px] w-full mt-4 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrend} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.03)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                      dy={25}
                    />
                    <YAxis 
                      hide
                      domain={[0, 100]} 
                    />
                    <Tooltip 
                      cursor={{ stroke: '#2563EB', strokeWidth: 2, strokeDasharray: '4 4' }}
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF',
                        borderRadius: '24px', 
                        border: 'none', 
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                        padding: '20px 28px'
                      }}
                      itemStyle={{ color: '#2563EB', fontWeight: 900, fontSize: '18px' }}
                      labelStyle={{ color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 900 }}
                      formatter={(value) => [`${value}% Accuracy`]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#2563EB" 
                      strokeWidth={5} 
                      fillOpacity={1} 
                      fill="url(#colorAcc)"
                      activeDot={{ r: 10, strokeWidth: 4, stroke: '#FFF', fill: '#2563EB', shadow: '0 10px 20px rgba(37,99,235,0.3)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Subject Performance */}
            <section className="glass-card p-10 md:p-12 rounded-[3.5rem] border border-white shadow-2xl shadow-slate-200/50 flex flex-col group transition-all duration-500 hover:shadow-indigo-50">
              <div className="mb-14">
                <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Subject Vector</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">Relative Domain Proficiency</p>
              </div>
              
              <div className="flex-1 space-y-10">
                {subjectPerf.slice(0, 5).map((entry, index) => (
                  <div key={index} className="group/item">
                    <div className="flex justify-between items-end mb-4 px-1">
                      <span className="text-lg font-black text-slate-800 group-hover/item:text-blue-600 transition-colors tracking-tight">{entry.name}</span>
                      <span className={`text-xl font-black ${entry.accuracy > 70 ? 'text-emerald-500' : 'text-blue-500'}`}>{entry.accuracy}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${entry.accuracy}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${index % 2 === 0 ? 'from-blue-600 to-indigo-500' : 'from-indigo-600 to-blue-500'} shadow-lg`}
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{entry.total} ATTEMPTS</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-14 py-6 bg-slate-900 hover:bg-blue-600 border border-slate-800 rounded-[2rem] text-white text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95">
                Expand Full Vector Analysis
              </button>
            </section>
          </div>
        ) : (
          <div className="glass-card p-24 text-center rounded-[5rem] border border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] max-w-3xl mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-transparent pointer-events-none" />
            <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex items-center justify-center mx-auto mb-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Target className="w-16 h-16 text-blue-500/20" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Zero Data Detected</h2>
            <p className="text-slate-400 font-medium mb-16 text-xl leading-relaxed max-w-lg mx-auto">
              Initialize your first clinical simulation to generate performance vectors and recalibrate your neural buffers.
            </p>
            <Link href="/quiz" className="relative group inline-flex items-center gap-6 bg-slate-900 text-white px-16 py-8 rounded-[2.5rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 uppercase tracking-widest text-sm">Start Protocol</span>
              <Sparkles className="relative z-10 w-6 h-6 animate-pulse" />
            </Link>
          </div>
        )}

        {/* Footer Insight HUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-12">
          <InsightHUD icon={Zap} title="Neural Velocity" value="2.4s" trend="Optimal" color="blue" />
          <InsightHUD icon={Shield} title="Data Integrity" value="High" trend="Verified" color="emerald" />
          <InsightHUD icon={Activity} title="Recalibration" value="Active" trend="In-Progress" color="indigo" />
        </div>
      </div>
    </main>
  )
}

function KPICard({ icon: Icon, label, value, color, description }) {
  const colors = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/50',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100/50',
    orange: 'text-orange-600 bg-orange-50 border-orange-100 shadow-orange-100/50',
    violet: 'text-violet-600 bg-violet-50 border-violet-100 shadow-violet-100/50',
  }

  return (
    <div className="glass-card p-10 rounded-[3rem] border border-white hover:border-slate-200 transition-all group relative overflow-hidden shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-10 transition-all group-hover:scale-110 group-hover:rotate-6 border shadow-lg ${colors[color]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-black text-slate-900 tracking-tighter">{value || 0}</p>
        <div className="mb-1 p-1.5 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
          <ArrowUpRight size={16} strokeWidth={3} />
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 mt-4 italic opacity-0 group-hover:opacity-100 transition-opacity duration-500">{description}</p>
    </div>
  )
}

function InsightHUD({ icon: Icon, title, value, trend, color }) {
  return (
    <div className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-6 group hover:scale-[1.02] transition-all duration-500">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
        <Icon className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">{title}</p>
        <div className="flex items-center gap-4">
          <span className="text-2xl font-black text-slate-900">{value}</span>
          <span className="px-3 py-1 text-[9px] font-black text-blue-600 bg-blue-50 rounded-lg uppercase tracking-widest border border-blue-100">{trend}</span>
        </div>
      </div>
    </div>
  )
}
