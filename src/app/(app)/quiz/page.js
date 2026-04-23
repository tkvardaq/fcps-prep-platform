'use client'

import { useState, useEffect } from 'react'
import { getPracticeQuestions, updateProgress } from '@/actions/quiz'
import { addToQueue, getQueue, removeFromQueue } from '@/lib/db'
import Link from 'next/link'
import { 
  Timer, 
  ChevronRight, 
  ChevronLeft, 
  Activity, 
  ShieldCheck, 
  BookOpen,
  CheckCircle2,
  XCircle,
  CloudLightning,
  Sparkles,
  Brain,
  Zap,
  Target,
} from 'lucide-react'

export default function QuizPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isComplete, setIsComplete] = useState(false)



  async function loadQuestions() {
    setLoading(true)
    const res = await getPracticeQuestions()
    if (res.success) {
      setQuestions(res.data)
      setTimeLeft(60)
    }
    setLoading(false)
  }

  async function handleSync() {
    if (!navigator.onLine) return
    setSyncing(true)
    const queue = await getQueue()
    for (const item of queue) {
      if (item.action === 'updateProgress') {
        const res = await updateProgress(item.payload)
        if (res.success) await removeFromQueue(item.id)
      }
    }
    setSyncing(false)
  }

  const handleOptionSelect = (option) => {
    if (showExplanation) return
    setSelectedOption(option)
    setShowExplanation(true)
  }

  const handleSM2Rating = async (quality) => {
    const question = questions[currentIndex]
    const payload = { 
      mcqId: question.id, 
      quality,
      isCorrect: selectedOption === question.correct_answer,
      timeTaken: 60 - timeLeft
    }

    if (navigator.onLine) {
      await updateProgress(payload)
    } else {
      await addToQueue('updateProgress', payload)
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setShowExplanation(false)
      setTimeLeft(60)
    } else {
      setIsComplete(true)
    }
  }

  const handleRetake = () => {
    setIsComplete(false)
    setCurrentIndex(0)
    setSelectedOption(null)
    setShowExplanation(false)
    loadQuestions()
  }

  useEffect(() => {
    loadQuestions()
    window.addEventListener('online', handleSync)
    return () => window.removeEventListener('online', handleSync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (timeLeft > 0 && !showExplanation) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft, showExplanation])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <div className="relative">
        <div className="w-24 h-24 border-[6px] border-primary/10 border-t-primary rounded-[2.5rem] animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Activity size={32} className="text-primary animate-pulse" />
        </div>
      </div>
      <div className="mt-10 text-center space-y-2">
        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Initializing Protocol</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Clinical Repository</p>
      </div>
    </div>
  )

  const currentQuestion = questions[currentIndex]
  if (!currentQuestion && !isComplete) return null

  const options = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ]

  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <main className="min-h-screen bg-[#0f172a] selection:bg-primary/20 font-sans pb-24 md:pb-8 relative overflow-hidden">
      {/* Cinematic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 relative z-10">
        
        {/* High-Focus Clinical Header */}
        <header className="backdrop-blur-xl bg-white/[0.03] border border-white/10 p-6 md:p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10 flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all active:scale-95 group/back"
            >
              <ChevronLeft size={24} className="group-hover/back:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                </div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Protocol: Clinical Active</p>
              </div>
              <h1 className="text-xl md:text-2xl font-display font-black text-white tracking-tight flex items-center gap-3">
                Knowledge Synthesis <span className="text-slate-500 font-medium">|</span> <span className="text-primary/80">V1.0</span>
              </h1>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-5 bg-white/5 px-6 py-3 rounded-3xl border border-white/5 shadow-inner">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500 ${timeLeft < 10 ? 'bg-rose-500/20 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-primary/20 text-primary'}`}>
                <Timer size={20} className={timeLeft < 10 ? 'animate-pulse' : ''} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Time Latency</p>
                <p className={`text-xl font-display font-black tracking-tighter leading-none mt-0.5 ${timeLeft < 10 ? 'text-rose-400' : 'text-white'}`}>
                  {timeLeft}s
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-5 bg-white/5 px-6 py-3 rounded-3xl border border-white/5 shadow-inner">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
                <Brain size={20} />
              </div>
              <div className="text-right md:text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Neural Index</p>
                <p className="text-xl font-display font-black text-white tracking-tighter leading-none mt-0.5">
                  {currentIndex + 1}<span className="text-white/20 mx-1.5 text-sm">/</span>{questions.length}
                </p>
              </div>
            </div>
          </div>
        </header>

        {isComplete ? (
          <div className="flex flex-col items-center justify-center min-h-[550px] space-y-8 bg-white/[0.02] border border-white/10 rounded-[3.5rem] p-8 md:p-16">
            <CheckCircle2 size={80} className="text-emerald-500 animate-pulse" />
            <h2 className="text-4xl font-display font-black text-white text-center">Session Complete!</h2>
            <p className="text-slate-400 font-medium text-center">You have completed all questions in this session.</p>
            <button 
              onClick={handleRetake}
              className="mt-8 px-10 py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-primary/80 transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Immersive Question Chamber */}
          <div className="lg:col-span-8 space-y-6">
            <div className="backdrop-blur-xl bg-white/[0.02] p-8 md:p-16 rounded-[3.5rem] shadow-2xl border border-white/10 relative overflow-hidden min-h-[550px] flex flex-col group/chamber">
              {/* Animated Inner Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
              
              {/* Question Context Tags */}
              <div className="relative z-10 flex items-center gap-4 mb-12">
                <div className="px-5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 shadow-lg shadow-primary/5">
                  <Target size={14} className="animate-pulse" />
                  {currentQuestion.subject || 'Clinical Sciences'}
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="px-5 py-2 bg-white/5 text-slate-400 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
                  Difficulty: {currentQuestion.difficulty || 'Core'}
                </div>
              </div>

              {/* Question Content */}
              <div className="relative z-10 mb-16 flex-grow">
                <h2 className="text-2xl md:text-4xl font-display font-black text-white leading-[1.2] tracking-tight drop-shadow-sm">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* MCQ Response Matrix */}
              <div className="relative z-10 grid grid-cols-1 gap-5">
                {options.map((opt) => {
                  const isCorrect = opt.key === currentQuestion.correct_answer
                  const isSelected = selectedOption === opt.key
                  
                  let stateStyle = "bg-white/[0.03] border-white/5 text-slate-300 hover:border-primary/40 hover:bg-white/[0.06] hover:text-white"
                  let labelStyle = "bg-white/5 text-slate-500 group-hover/opt:text-primary group-hover/opt:bg-primary/20"
                  
                  if (showExplanation) {
                    if (isCorrect) {
                      stateStyle = "bg-emerald-500/10 border-emerald-500 text-emerald-100 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
                      labelStyle = "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                    } else if (isSelected) {
                      stateStyle = "bg-rose-500/10 border-rose-500 text-rose-100 shadow-[0_0_40px_rgba(244,63,94,0.1)]"
                      labelStyle = "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                    } else {
                      stateStyle = "bg-transparent border-white/5 opacity-20 scale-[0.98] blur-[0.5px]"
                      labelStyle = "bg-white/5 text-slate-600"
                    }
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleOptionSelect(opt.key)}
                      disabled={showExplanation}
                      className={`w-full text-left p-6 md:p-8 rounded-[2.5rem] border-2 font-medium transition-all duration-500 flex items-center gap-6 group/opt relative overflow-hidden ${stateStyle} ${!showExplanation && 'hover:-translate-y-1 active:scale-[0.99]'}`}
                    >
                      {/* Hover Particle Effect */}
                      {!showExplanation && (
                        <div className="absolute inset-0 opacity-0 group-hover/opt:opacity-100 transition-opacity duration-500">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16" />
                        </div>
                      )}

                      <span className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center font-display font-black text-xl transition-all duration-500 z-10 ${labelStyle}`}>
                        {opt.key}
                      </span>
                      <span className="text-lg md:text-xl font-bold leading-snug flex-grow z-10">{opt.text}</span>
                      
                      {showExplanation && (isCorrect || isSelected) && (
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center animate-in zoom-in spin-in-90 duration-500 z-10 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Analytics & Intelligence */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Session Velocity Card */}
            <div className="backdrop-blur-xl bg-white/[0.03] p-8 rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-[60px] -mr-16 -mt-16 animate-pulse" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Mastery Matrix</p>
                    <h3 className="text-xl font-display font-black text-white">Neural Velocity</h3>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/10 border border-primary/20">
                    <Zap size={24} className="fill-primary/20" />
                  </div>
                </div>
                
                <div className="flex items-baseline justify-between mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-display font-black text-white tracking-tighter">
                      {Math.round(progress)}
                    </span>
                    <span className="text-xl font-display font-bold text-white/40">%</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Session Load</span>
                </div>

                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-[3px] shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_100%)] w-1/2 h-full animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Elapsed</p>
                    <p className="text-lg font-display font-black text-white">{(currentIndex * 45 / 60).toFixed(1)}m</p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-right">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Queue</p>
                    <p className="text-lg font-display font-black text-white">{questions.length - currentIndex} Left</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostic Insight Hub */}
            <div className="backdrop-blur-xl bg-white/[0.03] rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden min-h-[350px] relative">
              {showExplanation ? (
                <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Sparkles size={20} />
                      </div>
                      <h3 className="text-xs font-display font-black text-white uppercase tracking-[0.2em]">Diagnostic Insight</h3>
                    </div>
                    <div className="p-6 bg-white/[0.04] rounded-[2.5rem] border border-white/10 relative">
                      <div className="absolute top-0 left-8 w-4 h-[2px] bg-emerald-500/50" />
                      <p className="text-slate-300 leading-relaxed font-medium text-sm italic">
                        &quot;{currentQuestion.explanation}&quot;
                      </p>
                    </div>
                  </div>

                  {currentQuestion.reference_book && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                      <BookOpen size={16} className="text-primary/60" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                        Source: {currentQuestion.reference_book}
                      </span>
                    </div>
                  )}

                  <div className="space-y-6 pt-6 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1.5">Synaptic Feedback</p>
                      <p className="text-xs font-bold text-slate-400">Rate your clinical confidence recall</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { val: 0, label: 'Null', icon: '🌑' },
                        { val: 1, label: 'Faint', icon: '🌘' },
                        { val: 2, label: 'Weak', icon: '🌗' },
                        { val: 3, label: 'Stable', icon: '🌖' },
                        { val: 4, label: 'Strong', icon: '🌕' },
                        { val: 5, label: 'Acute', icon: '✨' },
                      ].map((rating) => (
                        <button
                          key={rating.val}
                          onClick={() => handleSM2Rating(rating.val)}
                          className="flex flex-col items-center gap-2.5 p-4 rounded-[2rem] border border-white/5 bg-white/5 hover:border-primary/50 hover:bg-primary/10 hover:shadow-xl transition-all duration-500 group hover:-translate-y-1 active:scale-95"
                        >
                          <span className="text-2xl group-hover:scale-125 transition-transform duration-500 drop-shadow-md">
                            {rating.icon}
                          </span>
                          <span className="text-[8px] font-black text-slate-500 group-hover:text-primary uppercase tracking-tighter transition-colors">
                            {rating.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-8 h-full min-h-[450px]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="w-28 h-28 bg-white/5 rounded-[3rem] flex items-center justify-center text-slate-500 border border-white/10 shadow-inner relative z-10 group-hover:scale-110 transition-transform duration-700">
                      <CloudLightning size={56} className="animate-bounce" />
                    </div>
                  </div>
                  <div className="space-y-3 max-w-[220px] relative z-10">
                    <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Awaiting Analysis</p>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">System monitoring response vectors. Submit clinical selection to initialize insight engine.</p>
                  </div>
                  <div className="flex gap-2 relative z-10">
                    <span className="w-2 h-2 rounded-full bg-white/10 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-white/10 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-white/10 animate-pulse [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic Persistence Badge */}
            <div className="bg-white text-slate-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] -mr-16 -mt-16" />
              <div className="relative z-10 flex items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/20">
                  <ShieldCheck size={24} className="text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400">Diagnostic Integrity</h4>
                  <p className="text-slate-900 text-sm font-bold leading-tight">
                    Session state is auto-encrypted and synced with the FCPS Central Repository.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
        )}
      </div>

      {syncing && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-10 py-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-5 animate-in slide-in-from-bottom-10 duration-700 border border-white/20 backdrop-blur-3xl z-[100]">
          <div className="relative">
            <div className="w-5 h-5 bg-primary rounded-full animate-ping opacity-75" />
            <div className="absolute inset-0 w-5 h-5 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em]">Syncing Neural Progress</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          from { transform: translateX(-100%); }
          to { transform: translateX(200%); }
        }
        @font-face {
          font-family: 'Geist Mono';
          src: url('https://cdn.jsdelivr.net/font-geist/1.3.0/geist-mono/GeistMono-Bold.woff2') format('woff2');
        }
        .font-display {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>
    </main>
  )
}
