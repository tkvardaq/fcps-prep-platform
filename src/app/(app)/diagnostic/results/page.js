'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Trophy, 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Zap,
  BookOpen,
  ArrowRight,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { Toaster, toast } from 'sonner'

export default function DiagnosticResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadResults()
  }, [])

  async function loadResults() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('diagnostic_results')
      .select('*, subjects(name, color_hex)')
      .eq('user_id', user.id)
      .order('score_percent', { ascending: false })

    if (error) {
      toast.error('Failed to load results')
    }

    setResults(data || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score_percent, 0) / results.length)
    : 0

  const weakSubjects = results.filter(r => r.score_percent < 60)
  const strongSubjects = results.filter(r => r.score_percent >= 70)

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <Toaster richColors position="top-center" />
      
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-full font-bold text-sm mb-2">
          <Zap className="w-4 h-4" /> Diagnostic Baseline Established
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Your <span className="text-rose-500">Performance</span> Report</h1>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          We&apos;ve analyzed your diagnostic assessment. Here is where you stand and what we recommend for your FCPS Part 1 preparation.
        </p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-rose-100 card-shadow p-20 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-4">No Baseline Found</h2>
            <p className="text-slate-500 font-medium mb-10">You need to complete a diagnostic test first to see your report.</p>
            <Link href="/planner" className="bg-rose-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg">Back to Planner</Link>
        </div>
      ) : (
        <>
          {/* Main Score & Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 p-10 card-shadow flex flex-col md:flex-row items-center gap-10">
              <div className="relative shrink-0">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" className="stroke-slate-100 fill-none" strokeWidth="12" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    className="stroke-rose-500 fill-none transition-all duration-1000 ease-out" 
                    strokeWidth="12" 
                    strokeDasharray={440} 
                    strokeDashoffset={440 - (440 * avgScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-slate-900">{avgScore}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average</span>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-slate-900">Expert Recommendation</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Based on your score, we recommend a <span className="text-rose-600 font-bold">{avgScore < 60 ? 'Focus-First Plan' : 'High-Yield Revision'}</span>. 
                  {weakSubjects.length > 0 
                    ? ` Prioritize ${weakSubjects[0].subjects.name} ${weakSubjects[1] ? `and ${weakSubjects[1].subjects.name}` : ''} during your preparation.`
                    : " Your foundation is solid! A balanced revision plan will work best for you."}
                </p>
                <Link 
                  href="/planner"
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-between group hover:bg-slate-800 transition-all"
                >
                  Go to Planner <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="bg-rose-500 rounded-[2.5rem] p-10 text-white card-shadow flex flex-col justify-between">
              <div>
                <Trophy className="w-10 h-10 mb-6 opacity-80" />
                <p className="text-rose-100 font-bold text-sm uppercase tracking-widest mb-1">Status</p>
                <h4 className="text-3xl font-black tracking-tight mb-4">Baseline Ready</h4>
              </div>
              <p className="text-rose-100 text-sm font-medium leading-relaxed">
                Every session from now on will refine this baseline. You&apos;re officially on track!
              </p>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Success Areas */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 card-shadow">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
                Core Strengths
              </h3>
              <div className="space-y-6">
                {strongSubjects.length > 0 ? strongSubjects.map(item => (
                  <ScoreRow key={item.id} name={item.subjects.name} score={item.score_percent} color="bg-teal-500" />
                )) : <p className="text-slate-400 text-sm italic">Keep studying to identify your peak performance areas! ✨</p>}
              </div>
            </div>

            {/* Growth Areas */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 card-shadow">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
                Priority Focus Areas
              </h3>
              <div className="space-y-6">
                {weakSubjects.length > 0 ? weakSubjects.filter(w => w.score_percent < 70).map(item => (
                  <ScoreRow key={item.id} name={item.subjects.name} score={item.score_percent} color="bg-rose-500" />
                )) : <p className="text-slate-400 text-sm italic">Amazing! No major weak areas identified yet. 🚀</p>}
              </div>
            </div>
          </div>

          {/* Next Step */}
          <div className="bg-slate-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-100">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 card-shadow">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800">Ready to start studying?</h4>
                <p className="text-slate-500 font-medium text-sm">Jump into a specific subject or let the AI guide you.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/subjects" className="px-8 py-4 text-slate-600 font-bold hover:bg-white rounded-2xl transition-all">Browse Books</Link>
              <Link href="/planner" className="px-8 py-4 bg-rose-500 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all soft-glow-pink">To My Schedule ✨</Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function ScoreRow({ name, score, color }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <span className="font-bold text-slate-700">{name}</span>
        <span className="text-sm font-black text-slate-900">{score}%</span>
      </div>
      <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
        <div 
          className={clsx("h-full rounded-full transition-all duration-1000", color)} 
          style={{ width: `${score}%` }} 
        />
      </div>
    </div>
  )
}
