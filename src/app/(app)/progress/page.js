'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Target, Trophy, Activity, BookOpen, Flame } from 'lucide-react'

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

    // Overall stats
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

    // Streak
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30)

    let streak = 0
    if (sessions?.length > 0) {
      const today = new Date(); today.setHours(0,0,0,0)
      const uniqueDays = [...new Set(sessions.map(s => {
        const d = new Date(s.completed_at); d.setHours(0,0,0,0); return d.getTime()
      }))].sort((a,b) => b - a)
      
      const diff = (today.getTime() - uniqueDays[0]) / (1000*60*60*24)
      if (diff <= 1) {
        streak = 1
        for (let i = 1; i < uniqueDays.length; i++) {
          if ((uniqueDays[i-1] - uniqueDays[i]) / (1000*60*60*24) === 1) streak++
          else break
        }
      }
    }

    // Topics mastered (>= 80% accuracy with >= 10 attempts)
    const { data: topicAttempts } = await supabase
      .from('user_attempts')
      .select('topic_id, is_correct')
      .eq('user_id', user.id)

    let topicsMastered = 0
    if (topicAttempts) {
      const byTopic = {}
      topicAttempts.forEach(a => {
        if (!byTopic[a.topic_id]) byTopic[a.topic_id] = { total: 0, correct: 0 }
        byTopic[a.topic_id].total++
        if (a.is_correct) byTopic[a.topic_id].correct++
      })
      topicsMastered = Object.values(byTopic).filter(t => t.total >= 10 && (t.correct / t.total) >= 0.8).length
    }

    setStats({
      totalAttempts: totalAttempts || 0,
      accuracy,
      sessions: totalSessions || 0,
      streak,
      topicsMastered
    })

    // Weekly accuracy trend (last 14 days)
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
      const day = new Date(s.completed_at).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
      if (!byDate[day]) byDate[day] = { total: 0, correct: 0 }
      byDate[day].total += s.total_questions
      byDate[day].correct += s.correct_answers
    })

    setWeeklyTrend(Object.entries(byDate).map(([day, v]) => ({
      day,
      accuracy: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      mcqs: v.total
    })))

    // Subject performance
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
      name: s.name.length > 12 ? s.name.slice(0, 10) + '…' : s.name,
      accuracy: Math.round((s.correct / s.total) * 100),
      total: s.total
    })).sort((a, b) => b.total - a.total))

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hasData = (stats?.totalAttempts || 0) > 0

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 card-shadow">
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Performance Analytics</h1>
        <p className="text-slate-500">Track your progress across all subjects and identify areas for improvement.</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPICard icon={Target} label="Total MCQs" value={stats?.totalAttempts || 0} />
        <KPICard icon={TrendingUp} label="Accuracy" value={`${stats?.accuracy || 0}%`} />
        <KPICard icon={Activity} label="Sessions" value={stats?.sessions || 0} />
        <KPICard icon={Flame} label="Streak" value={`${stats?.streak || 0}d`} />
        <KPICard icon={BookOpen} label="Mastered" value={stats?.topicsMastered || 0} />
      </div>

      {hasData ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Trend */}
          <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Accuracy Trend (Last 14 Days)</h2>
            {weeklyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">No recent session data</p>
            )}
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Subject Performance</h2>
            {subjectPerf.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Bar dataKey="accuracy" fill="#3b82f6" radius={[0, 8, 8, 0]} name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-center py-12">No subject data yet</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-16 text-center">
          <Target className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Data Yet</h2>
          <p className="text-slate-500 max-w-md mx-auto">Start practicing MCQs or take a mock exam to see your performance analytics here.</p>
        </div>
      )}
    </div>
  )
}

function KPICard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-blue-600" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  )
}
