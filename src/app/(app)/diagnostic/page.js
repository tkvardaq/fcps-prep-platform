'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'sonner'
import { 
  ArrowRight, 
  Stethoscope, 
  Timer, 
  Activity,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  ChevronLeft,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react'
import { recordDiagnosticResult } from '@/app/actions/study-actions'
import { generateStudyPlan } from '@/app/actions/ai-actions'
import { updateProgress } from '@/actions/quiz'
import Link from 'next/link'

export default function DiagnosticPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)

  const router = useRouter()
  const supabase = createClient()



  const handleSelect = (option) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }))
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setTimeLeft(60)
    } else {
      finishDiagnostic()
    }
  }

  const finishDiagnostic = async () => {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Authentication required')
      return
    }

    const mappedAnswers = {}
    questions.forEach(q => {
      const selected = answers[q.id]
      if (selected) {
        if (selected === q.option_a) mappedAnswers[q.id] = 'A'
        else if (selected === q.option_b) mappedAnswers[q.id] = 'B'
        else if (selected === q.option_c) mappedAnswers[q.id] = 'C'
        else if (selected === q.option_d) mappedAnswers[q.id] = 'D'
        else mappedAnswers[q.id] = selected
      }
    })

    try {
      toast.info('Analyzing clinical proficiency...')
      
      for (const q of questions) {
        const isCorrect = mappedAnswers[q.id] === q.correct_answer
        await updateProgress({
          mcqId: q.id,
          quality: isCorrect ? 4 : 2,
          isCorrect,
          timeTaken: 60
        })
      }
      
      await recordDiagnosticResult({ questions, answers: mappedAnswers })

      const subjectScores = {}
      questions.forEach(q => {
        const subName = q.subjects?.name || 'Unknown'
        if (!subjectScores[subName]) subjectScores[subName] = { total: 0, correct: 0 }
        subjectScores[subName].total++
        if (mappedAnswers[q.id] === q.correct_answer) subjectScores[subName].correct++
      })

      const weakSubjects = []
      const strongSubjects = []
      Object.entries(subjectScores).forEach(([name, vals]) => {
        const acc = vals.total > 0 ? (vals.correct / vals.total) * 100 : 0
        if (acc < 50) weakSubjects.push(name)
        else if (acc >= 70) strongSubjects.push(name)
      })

      const profileData = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      const p = profileData.data
      
      toast.info('Generating AI study trajectory...')
      await generateStudyPlan(
        p?.exam_date || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
        p?.daily_study_hours || 4,
        p?.paper_focus || 'Both Papers',
        weakSubjects,
        strongSubjects
      )

      toast.success('Strategy initialized!')
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch {
      toast.error('Diagnostic analysis failed')
      router.push('/dashboard')
    }
  }

  useEffect(() => {
    async function loadQuestions() {
      const { data: mcqs, error } = await supabase.rpc('get_diagnostic_questions')
      
      if (error || !mcqs || mcqs.length === 0) {
        toast.error('Clinical database unavailable')
        setLoading(false)
        return
      }

      setQuestions(mcqs)
      setLoading(false)
    }
    
    loadQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (timeLeft === 0) {
      handleNext()
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, loading, submitting, questions.length])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBFB]">
        <div className="relative">
          <div className="w-24 h-24 border-[6px] border-primary/10 border-t-primary rounded-[2rem] animate-[spin_1.5s_linear_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            <Activity size={32} className="animate-pulse" />
          </div>
        </div>
        <div className="mt-12 text-center space-y-3">
          <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight uppercase">Accessing Question Bank</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] animate-pulse">Syncing Clinical Registry</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBFB] p-8">
        <div className="glass-card p-14 rounded-[4rem] text-center max-w-md border-rose-100/50 shadow-2xl bg-white space-y-8">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">Clinical Archive Empty</h2>
            <p className="text-slate-500 font-bold text-sm leading-relaxed tracking-tight">
              No MCQs detected in the primary vault. Please verify system data in configuration settings.
            </p>
          </div>
          <button 
            onClick={() => router.push('/settings')} 
            className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-display font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:bg-slate-800 transition-all active:scale-95"
          >
            Open System Config
          </button>
        </div>
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBFB] p-8 text-center">
        <div className="relative mb-16">
          <div className="w-40 h-40 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10 animate-pulse">
            <BrainCircuit size={80} className="text-primary" />
          </div>
          <div className="absolute inset-0 border-[6px] border-primary/5 border-t-primary rounded-full animate-[spin_2s_linear_infinite]" />
        </div>
        <div className="space-y-6 max-w-lg">
          <h2 className="text-5xl font-display font-black text-slate-900 tracking-tight">Clinical Processing...</h2>
          <p className="text-slate-400 text-xl font-bold leading-relaxed tracking-tight">
            Our diagnostic engine is mapping your cognitive strengths to architect your optimal study trajectory.
          </p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const options = [
    { key: 'A', text: currentQ.option_a },
    { key: 'B', text: currentQ.option_b },
    { key: 'C', text: currentQ.option_c },
    { key: 'D', text: currentQ.option_d },
  ].filter(o => o.text)
  
  const isSelected = (optText) => answers[currentQ.id] === optText
  const progressPercent = ((currentIndex + 1) / questions.length) * 100

  return (
    <main className="min-h-screen bg-[#FFFBFB] flex flex-col selection:bg-primary/10">
      <Toaster position="top-center" richColors />
      
      {/* Immersive Progress Header */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/50 px-6 py-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="w-14 h-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white text-xl font-display font-black shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
               <span className="relative z-10">{currentIndex + 1}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Diagnostic Phase</p>
              </div>
              <h3 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none">
                Section: {currentQ.subjects?.name || 'General Medicine'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-4">
              <div className="w-48 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 ease-out shadow-sm" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest min-w-[40px]">
                {Math.round(progressPercent)}%
              </span>
            </div>
            
            <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl text-lg font-display font-black border-2 transition-all duration-500 ${
              timeLeft <= 10 ? 'bg-rose-50 text-rose-500 border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-900 border-slate-100 shadow-inner'
            }`}>
              <Timer size={20} className={timeLeft <= 10 ? 'animate-bounce' : ''} />
              <span className="tracking-tighter">00:{timeLeft.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-16 lg:p-24 space-y-16">
        
        {/* Clinical Inquiry Area */}
        <section className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="space-y-6 relative">
            <div className="absolute -left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-transparent to-transparent rounded-full hidden md:block" />
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-white rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-[0.3em] text-primary shadow-sm">
              <Activity size={14} />
              Evaluation: {currentQ.id?.slice(0, 4)}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-[1.1] tracking-tight">
              {currentQ.question}
            </h1>
          </div>

          <div className="grid gap-6">
            {options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(opt.text)}
                className={`group relative w-full text-left p-8 md:p-10 rounded-[2.5rem] border-2 transition-all duration-500 flex items-center overflow-hidden hover-lift ${
                  isSelected(opt.text) 
                    ? 'border-primary bg-white shadow-[0_40px_80px_-20px_rgba(14,165,233,0.15)] ring-4 ring-primary/5' 
                    : 'border-slate-100 bg-white hover:border-primary/20 hover:bg-slate-50/50 shadow-sm'
                }`}
              >
                {isSelected(opt.text) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                )}
                
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-8 font-display font-black text-xl transition-all duration-500 shadow-sm border border-white ${
                  isSelected(opt.text) ? 'bg-slate-900 text-white scale-110' : 'bg-slate-50 text-slate-300 group-hover:bg-primary/10 group-hover:text-primary'
                }`}>
                  {opt.key}
                </div>
                
                <span className={`flex-1 font-display font-black text-xl md:text-2xl tracking-tight transition-all duration-500 ${
                  isSelected(opt.text) ? 'text-slate-900 translate-x-1' : 'text-slate-500 group-hover:text-slate-800 group-hover:translate-x-1'
                }`}>
                  {opt.text}
                </span>

                {isSelected(opt.text) && (
                  <div className="ml-4 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-in zoom-in duration-500">
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Tactical Control Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 py-16 border-t border-slate-100">
          <div className="flex items-center gap-6 max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 shrink-0 border border-slate-100 shadow-inner">
               <ShieldCheck size={24} />
            </div>
            <p className="text-slate-400 text-xs font-bold leading-relaxed tracking-tight italic">
              Systematic diagnostic responses ensure the most accurate AI study trajectory mapping.
            </p>
          </div>
          
          <button
            onClick={handleNext}
            disabled={!answers[currentQ.id]}
            className="group relative inline-flex items-center gap-8 bg-slate-900 disabled:opacity-20 disabled:grayscale hover:bg-primary text-white pl-12 pr-10 py-7 rounded-[2.5rem] font-display font-black uppercase tracking-[0.3em] text-[10px] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] transition-all hover:shadow-[0_40px_80px_-20px_rgba(14,165,233,0.4)] hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
            <span className="relative z-10">
              {currentIndex === questions.length - 1 ? 'Analyze Trajectory' : 'Confirm & Proceed'}
            </span>
            <div className="relative z-10 w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10 shadow-inner">
              <ArrowRight size={24} className="group-hover:translate-x-1.5 transition-transform duration-500" />
            </div>
          </button>
        </div>
      </div>

      {/* Sync Status Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-20 duration-700 border border-white/10">
            <div className="relative">
              <div className="w-6 h-6 bg-primary rounded-full animate-ping opacity-75" />
              <div className="absolute inset-0 w-6 h-6 bg-primary rounded-full shadow-[0_0_20px_rgba(14,165,233,0.8)]" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] block">Diagnostic Sync</span>
              <span className="text-xs font-bold text-slate-400 tracking-tight">Recalibrating Assessment Protocols...</span>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  )
}
