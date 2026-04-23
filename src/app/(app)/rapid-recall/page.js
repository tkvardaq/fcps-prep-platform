'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, ArrowRight, Home, RefreshCw, Eye, Sparkles, ChevronLeft, Info, Activity, Stethoscope } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { recordQuizSession } from '@/app/actions/study-actions'
import Link from 'next/link'

export default function RapidRecallPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState([])
  const [finished, setFinished] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchRandom() {
      const { data, error } = await supabase
        .from('mcqs')
        .select('*')
        .limit(50)
      
      if (data) {
        setQuestions(data.sort(() => 0.5 - Math.random()))
      }
      setLoading(false)
    }
    fetchRandom()
  }, [supabase])

  const handleResponse = async (knewIt) => {
    const currentQ = questions[currentIndex]
    const newResults = [...results, {
      questionId: currentQ.id,
      topicId: currentQ.topic_id,
      subjectId: currentQ.subject_id,
      selectedAnswer: knewIt ? currentQ.correct_answer : 'X',
      correctAnswer: currentQ.correct_answer,
      confidence: knewIt ? 'high' : 'low',
      timeTaken: 5
    }]
    setResults(newResults)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      setFinished(true)
      await recordQuizSession({
        topicId: null,
        subjectId: null,
        detailedAttempts: newResults,
        durationMinutes: 5
      })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#FFFBFB] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full" />
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mb-8 animate-bounce">
          <Brain className="w-10 h-10 text-primary" />
        </div>
        <p className="text-slate-400 font-display font-black tracking-widest uppercase text-[10px]">Initializing Synoptic Engine...</p>
      </div>
    </div>
  )

  if (finished) {
    const known = results.filter(r => r.selectedAnswer === r.correctAnswer).length
    const accuracy = Math.round((known / questions.length) * 100)
    
    return (
      <div className="min-h-screen bg-[#FFFBFB] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Ambient Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }} 
          animate={{ scale: 1, opacity: 1, y: 0 }} 
          className="glass-card p-12 md:p-20 rounded-[4rem] border border-white/80 text-center max-w-2xl w-full relative z-10 shadow-2xl shadow-slate-200/50"
        >
          <div className="w-24 h-24 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-12 group hover:rotate-0 transition-transform duration-500">
            <Zap className="w-12 h-12 fill-primary text-primary" />
          </div>
          
          <h2 className="text-5xl md:text-6xl font-display font-black text-slate-900 mb-6 tracking-tight">Rapid Recall <br /><span className="text-primary">Optimized</span></h2>
          <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed">
            You successfully recalled <span className="text-slate-900 font-black">{known}</span> facts with <span className="text-secondary font-black">{accuracy}%</span> clinical precision.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Efficiency</p>
              <p className="text-3xl font-display font-black text-slate-900">94%</p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Neural Load</p>
              <p className="text-3xl font-display font-black text-slate-900">Optimal</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <Link href="/dashboard" className="flex-1 px-8 py-6 bg-slate-100 text-slate-600 font-display font-black rounded-3xl hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs tracking-widest">
              <Home className="w-5 h-5" /> DASHBOARD
            </Link>
            <button onClick={() => window.location.reload()} className="flex-1 px-8 py-6 bg-slate-900 text-white font-display font-black rounded-3xl hover:shadow-2xl hover:shadow-slate-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 text-xs tracking-widest">
              <RefreshCw className="w-5 h-5" /> RE-INITIALIZE
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  return (
    <div className="min-h-screen bg-[#FFFBFB] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      <Toaster richColors />
      
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Info */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-12 relative z-10">
        <Link href="/dashboard" className="p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all active:scale-90">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-3 px-8 py-3 rounded-full bg-slate-900 text-white shadow-xl">
          <Zap className="w-4 h-4 text-primary fill-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Synoptic Rapid Recall</span>
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white border border-slate-100 text-slate-300">
          <Info className="w-6 h-6" />
        </div>
      </div>
      
      {/* Progress Bar Container */}
      <div className="w-full max-w-4xl mb-12 relative z-10">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          <span>Neural Convergence Stage</span>
          <span className="text-primary">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + (showAnswer ? '-ans' : '-q')}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="w-full max-w-4xl glass-card rounded-[4rem] p-12 md:p-20 border border-white/80 flex flex-col items-center text-center min-h-[550px] relative z-10 shadow-2xl shadow-slate-200/50 overflow-hidden"
        >
          {/* Subtle decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -ml-32 -mb-32" />
          
          <div className="bg-primary/5 text-primary border border-primary/10 px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] mb-16 backdrop-blur-sm shadow-inner">
            Primary Clinical Objective
          </div>
          
          <div className="relative mb-16 max-w-3xl">
            <h2 className="text-3xl md:text-5xl font-display font-black text-slate-900 leading-[1.2] tracking-tight relative z-10">
              {currentQ.question}
            </h2>
          </div>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-auto group relative overflow-hidden bg-slate-900 text-white px-16 py-8 rounded-[2.5rem] font-display font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl hover:shadow-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="relative flex items-center gap-5">
                <Eye className="w-8 h-8" /> REVEAL SYNTHESIS
              </div>
            </button>
          ) : (
            <div className="w-full mt-auto space-y-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-10 md:p-14 bg-slate-50/50 border border-slate-100 rounded-[3.5rem] relative overflow-hidden group text-left shadow-inner"
              >
                <div className="absolute top-0 right-0 p-8">
                  <Sparkles className="w-10 h-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Clinical Resolution</p>
                </div>
                
                <p className="text-slate-900 font-display font-black text-2xl md:text-3xl mb-6 leading-relaxed">
                  {currentQ[`option_${currentQ.correct_answer.toLowerCase()}`]}
                </p>
                <div className="h-1.5 w-16 bg-primary/20 rounded-full mb-6" />
                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                  {currentQ.explanation}
                </p>
              </motion.div>

              <div className="flex gap-8 w-full">
                <button
                  onClick={() => handleResponse(false)}
                  className="flex-1 py-7 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-200 font-display font-black rounded-[2rem] transition-all group flex items-center justify-center gap-3 text-xs tracking-[0.2em]"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" /> FORGOT
                </button>
                <button
                  onClick={() => handleResponse(true)}
                  className="flex-1 py-7 bg-slate-900 text-white font-display font-black rounded-[2rem] hover:shadow-2xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 group active:scale-95 text-xs tracking-[0.2em]"
                >
                  <Sparkles className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" /> RECALLED
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-16 flex items-center gap-12 text-slate-300">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em]">Active Recall</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-slate-100" />
        <div className="flex items-center gap-3">
          <Stethoscope className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em]">Clinical Pulse</span>
        </div>
      </div>
    </div>
  )
}
