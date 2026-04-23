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
  Loader2,
  Activity,
  ShieldCheck,
  TrendingUp,
  Brain,
  Stethoscope,
  Microscope,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { Toaster, toast } from 'sonner'

export default function DiagnosticResultsPage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadResults() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('diagnostic_results')
        .select('*, subjects(name, color_hex)')
        .eq('user_id', user.id)
        .order('score_percent', { ascending: false })

      if (error) {
        toast.error('Failed to load clinical diagnostics')
      }

      setResults(data || [])
      setLoading(false)
    }

    loadResults()
  }, [supabase])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <div className="relative">
        <div className="w-24 h-24 border-[6px] border-primary/10 border-t-primary rounded-[2.5rem] animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Microscope size={32} className="text-primary animate-pulse" />
        </div>
      </div>
      <div className="mt-10 text-center space-y-2">
        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Analyzing Baseline</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Generating Performance Matrix</p>
      </div>
    </div>
  )

  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score_percent, 0) / results.length)
    : 0

  const weakSubjects = results.filter(r => r.score_percent < 60)
  const strongSubjects = results.filter(r => r.score_percent >= 70)

  return (
    <main className="min-h-screen bg-[#f8fafc] selection:bg-primary/10 font-sans pb-24 md:pb-12">
      <Toaster richColors position="top-center" />
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-12">
        
        {/* Superior Performance Header */}
        <header className="text-center space-y-6 relative py-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-slate-900/10">
              <Activity className="w-4 h-4 text-primary animate-pulse" /> Diagnostic Protocol Finalized
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black text-slate-900 tracking-tight leading-none">
              Clinical <span className="text-primary italic">Performance</span> Report
            </h1>
            <p className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              We&apos;ve synthesized your diagnostic data into a clinical roadmap. Your baseline is established.
            </p>
          </div>
        </header>

        {results.length === 0 ? (
          <div className="bg-white rounded-[5rem] border border-slate-200/60 shadow-sm p-24 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[2000ms]">
              <AlertTriangle size={600} />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-10">
              <div className="w-32 h-32 bg-rose-50 text-rose-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-sm border border-rose-100 ring-8 ring-rose-50">
                <AlertTriangle size={64} />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tight">Baseline <span className="text-rose-500">Missing</span></h2>
                <p className="text-slate-500 font-medium text-xl leading-relaxed">
                  No diagnostic session detected. You must complete the initial evaluation to generate this report.
                </p>
              </div>
              <Link href="/planner" className="inline-flex items-center gap-6 bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-display font-black hover:scale-105 active:scale-95 transition-all shadow-2xl tracking-[0.2em] text-[11px] uppercase">
                Return to Command Center <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Executive Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Score Visualization Card */}
              <div className="lg:col-span-8 bg-white rounded-[4rem] border border-slate-200/60 p-10 md:p-14 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-12 group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] -mr-48 -mt-48 transition-all duration-700 group-hover:bg-primary/10" />
                
                <div className="relative shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse opacity-20">
                    <div className="w-56 h-56 rounded-full border-[20px] border-primary/20" />
                  </div>
                  <svg className="w-56 h-56 transform -rotate-90 relative z-10 drop-shadow-2xl">
                    <circle cx="112" cy="112" r="95" className="stroke-slate-50 fill-none" strokeWidth="18" />
                    <circle 
                      cx="112" cy="112" r="95" 
                      className="stroke-primary fill-none transition-all duration-2000 ease-out" 
                      strokeWidth="18" 
                      strokeDasharray={597} 
                      strokeDashoffset={597 - (597 * avgScore) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-6xl font-display font-black text-slate-900 tracking-tighter">{avgScore}%</span>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Composite</span>
                  </div>
                </div>

                <div className="relative z-10 space-y-6 flex-grow">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight">Expert Synthesis</h3>
                    <p className="text-slate-600 leading-relaxed font-medium text-lg">
                      Your performance profile indicates a <span className="text-primary font-black uppercase tracking-tight">{avgScore < 60 ? 'Structural Build Plan' : 'High-Precision Polishing'}</span> approach. 
                      {weakSubjects.length > 0 
                        ? ` We've flagged ${weakSubjects[0].subjects.name} as a high-priority intervention area.`
                        : " Your clinical foundation is exceptionally robust across all major domains."}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                    <Link 
                      href="/planner"
                      className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-display font-black text-[11px] uppercase tracking-widest flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20 group/btn"
                    >
                      Update Study Plan <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Status Trophy Card */}
              <div className="lg:col-span-4 bg-primary rounded-[4rem] p-12 text-white shadow-2xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-[60px] -mr-32 -mt-32" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
                      <Trophy size={32} className="text-white" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white/70 font-black text-[10px] uppercase tracking-[0.3em]">Synaptic Readiness</p>
                      <h4 className="text-4xl font-display font-black tracking-tight leading-tight">Baseline <span className="italic">Solid</span></h4>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm font-bold leading-relaxed pt-8 border-t border-white/10 mt-8">
                    Every future session will dynamically update this profile. You are now being tracked for cognitive decay.
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Strengths Card */}
              <div className="bg-white rounded-[4rem] border border-slate-200/60 p-10 shadow-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                  <Target size={150} />
                </div>
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-100">
                    <CheckCircle2 size={24} />
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Clinical Mastery</h3>
                </div>
                <div className="space-y-8 relative z-10">
                  {strongSubjects.length > 0 ? strongSubjects.map(item => (
                    <ScoreRow key={item.id} name={item.subjects.name} score={item.score_percent} color="bg-emerald-500" />
                  )) : (
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed text-center">
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Initial Data Inconclusive</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Growth Card */}
              <div className="bg-white rounded-[4rem] border border-slate-200/60 p-10 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                  <Activity size={150} />
                </div>
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">Growth Vectors</h3>
                </div>
                <div className="space-y-8 relative z-10">
                  {weakSubjects.length > 0 ? weakSubjects.map(item => (
                    <ScoreRow key={item.id} name={item.subjects.name} score={item.score_percent} color="bg-rose-500" />
                  )) : (
                    <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 border-dashed text-center">
                      <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest italic">No Critical Deficits</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Strategic Next Steps */}
            <div className="bg-slate-900 rounded-[5rem] p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.03)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.03)_50%,rgba(255,255,255,0.03)_75%,transparent_75%,transparent)] bg-[length:64px_64px] opacity-20" />
              
              <div className="flex items-center gap-8 relative z-10 text-center lg:text-left flex-col lg:flex-row">
                <div className="w-24 h-24 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center text-primary border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700">
                  <Stethoscope size={48} className="animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-3xl font-display font-black text-white tracking-tight">Ready for Deployment?</h4>
                  <p className="text-slate-400 font-medium text-lg max-w-md">Initialize your custom study sequence based on this diagnostic profile.</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full lg:w-auto">
                <Link href="/subjects" className="w-full sm:w-auto px-10 py-5 text-white font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white/5 rounded-[2rem] transition-all border border-white/10 text-center">
                  Browse Domain Repository
                </Link>
                <Link href="/planner" className="w-full sm:w-auto px-10 py-5 bg-primary text-white font-black uppercase tracking-[0.25em] text-[11px] rounded-[2rem] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3">
                  Activate Roadmap <Sparkles size={16} />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function ScoreRow({ name, score, color }) {
  return (
    <div className="space-y-3 group/row">
      <div className="flex justify-between items-end">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Domain</p>
          <span className="font-display font-black text-xl text-slate-800 group-hover/row:text-primary transition-colors">{name}</span>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
          <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">{score}%</span>
        </div>
      </div>
      <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1 shadow-inner relative">
        <div 
          className={clsx("h-full rounded-full transition-all duration-2000 ease-out shadow-sm relative", color)} 
          style={{ width: `${score}%` }} 
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
        </div>
      </div>
    </div>
  )
}
