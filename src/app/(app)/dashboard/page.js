'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  BookOpen, 
  Target, 
  Clock, 
  Activity, 
  ChevronRight, 
  PlayCircle, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Sparkles,
  BrainCircuit,
  Trophy,
  Flame,
  Zap
} from 'lucide-react'
import { AccuracyTrend, TopicMastery, RetentionMeter } from '@/components/analytics/PerformanceCharts'
import { getAnalyticsData } from '@/app/actions/study-actions'

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [paper, setPaper] = useState(null)
  const [todaySchedule, setTodaySchedule] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [dueReviews, setDueReviews] = useState(0)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load profile
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)

    // Load overall stats from user_attempts
    const { count: totalAttempts } = await supabase
      .from('user_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: correctCount } = await supabase
      .from('user_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_correct', true)

    const { count: sessionCount } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0

    // Streak (simple: count consecutive days from today)
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(30)

    let streak = 0
    if (sessions && sessions.length > 0) {
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

    setStats({
      totalAttempts: totalAttempts || 0,
      accuracy,
      sessions: sessionCount || 0,
      streak
    })

    // Paper readiness from user_attempts grouped by subject
    const { data: attempts } = await supabase
      .from('user_attempts')
      .select('subject_id, is_correct, subjects(paper_number)')
      .eq('user_id', user.id)

    let p1Total = 0, p1Correct = 0, p2Total = 0, p2Correct = 0
    attempts?.forEach(a => {
      if (a.subjects?.paper_number === 1) { p1Total++; if (a.is_correct) p1Correct++ }
      if (a.subjects?.paper_number === 2) { p2Total++; if (a.is_correct) p2Correct++ }
    })

    setPaper({
      paper1: p1Total > 0 ? Math.round((p1Correct / p1Total) * 100) : 0,
      paper2: p2Total > 0 ? Math.round((p2Correct / p2Total) * 100) : 0,
      overall: totalAttempts > 0 ? accuracy : 0
    })

    // Today's schedule
    const today = new Date().toISOString().split('T')[0]
    const { data: schedule } = await supabase
      .from('study_schedule')
      .select('*, subjects(name, color_hex), topics(name)')
      .eq('user_id', user.id)
      .eq('scheduled_date', today)
      .order('hours_allocated', { ascending: false })
    
    setTodaySchedule(schedule || [])

    // Weak topics
    const { data: weak } = await supabase
      .from('weak_topics')
      .select('*, topics(name), subjects(name, color_hex)')
      .eq('user_id', user.id)
      .order('accuracy_percent', { ascending: true })
      .limit(5)
    
    setWeakTopics(weak || [])

    // Due reviews
    const { count: due } = await supabase
      .from('revision_queue')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('next_review_date', today)

    setDueReviews(due || 0)

    // Load Analytics
    const analyticsData = await getAnalyticsData()
    setAnalytics(analyticsData)

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const daysUntilExam = profile?.exam_date 
    ? Math.max(0, Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  const firstName = profile?.full_name?.split(' ')[0] || 'Doctor'

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">

      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-2xl border border-slate-100 card-shadow">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Good {getGreeting()}, Dr. {firstName}</h1>
          <p className="text-slate-500 font-medium">
            {daysUntilExam !== null ? (
              <>{daysUntilExam > 0 ? `${daysUntilExam} days until your FCPS exam.` : 'Your exam is today! Best of luck! 🎯'}</>
            ) : 'Set your exam date in Settings to see your countdown.'}
          </p>
        </div>
        {daysUntilExam !== null && daysUntilExam > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold text-sm">
            <Calendar className="w-4 h-4" /> {daysUntilExam} Days Left
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Target} label="MCQs Attempted" value={stats?.totalAttempts || 0} color="text-blue-600" bg="bg-blue-50" />
        <KPICard icon={TrendingUp} label="Accuracy" value={`${stats?.accuracy || 0}%`} color="text-teal-600" bg="bg-teal-50" />
        <KPICard icon={Flame} label="Study Streak" value={`${stats?.streak || 0} days`} color="text-orange-600" bg="bg-orange-50" />
        <KPICard icon={BrainCircuit} label="Due Reviews" value={dueReviews} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column (3/5) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Today's Plan */}
          <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
            <div className="flex items-center justify-between p-6 pb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Today&apos;s Plan
              </h2>
              <Link href="/planner" className="text-blue-600 text-sm font-bold hover:underline">Full Schedule →</Link>
            </div>
            
            {todaySchedule.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {todaySchedule.slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-10 rounded-full" style={{ backgroundColor: item.subjects?.color_hex || '#3B82F6' }}></div>
                      <div>
                        <p className="font-bold text-slate-800">{item.topics?.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.subjects?.name} · {item.hours_allocated}h · <span className="capitalize">{item.task_type}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.is_completed ? (
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Done</span>
                      ) : (
                        <Link href={`/study/${item.topic_id}`} className="text-blue-600 hover:text-blue-700">
                          <PlayCircle className="w-5 h-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 pb-6 text-center">
                <p className="text-slate-400 font-medium py-8">No study plan for today. <Link href="/onboarding" className="text-blue-600 hover:underline">Generate your AI plan →</Link></p>
              </div>
            )}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Accuracy Trend
              </h2>
              <AccuracyTrend data={analytics?.trendData || []} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
                <Trophy className="w-5 h-5 text-amber-500" /> Topic Mastery
              </h2>
              <TopicMastery data={analytics?.masteryData || []} />
            </div>
          </div>
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Retention Meter */}
          <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Memory Strength</h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">Likelihood of recall today</p>
            <RetentionMeter percentage={analytics?.retention || 0} />
            
            <div className="mt-4 pt-4 border-t border-slate-50 text-left">
              <div className="space-y-3">
                <ProgressBar label="Paper 1 — Basic Sciences" value={paper?.paper1 || 0} color="bg-blue-500" />
                <ProgressBar label="Paper 2 — Clinical" value={paper?.paper2 || 0} color="bg-teal-500" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/subjects" className="flex items-center justify-between p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-blue-900">Study Notes</span>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/mock-exam" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <span className="font-bold text-slate-800">Mock Exam</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/revision" className="flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-5 h-5 text-purple-600" />
                  <span className="font-bold text-purple-900">Revision ({dueReviews} due)</span>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/rapid-recall" className="flex items-center justify-between p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <span className="font-bold text-amber-900">Rapid Recall (Active Recall)</span>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/leaderboard" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-slate-600" />
                  <span className="font-bold text-slate-800">Leaderboard</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

function KPICard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-5 flex items-center gap-4">
      <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-900">{value}%</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  )
}
