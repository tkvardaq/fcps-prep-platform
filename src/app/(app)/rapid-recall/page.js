'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Brain, ArrowRight, Home, RefreshCw, Eye } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { recordQuizSession } from '@/app/actions/study-actions'

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
      // Get 50 random MCQs for rapid recall
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
  }, [])

  const handleResponse = async (knewIt) => {
    const currentQ = questions[currentIndex]
    const newResults = [...results, {
      questionId: currentQ.id,
      topicId: currentQ.topic_id,
      subjectId: currentQ.subject_id,
      selectedAnswer: knewIt ? currentQ.correct_answer : 'X', // 'X' means failed recall
      correctAnswer: currentQ.correct_answer,
      confidence: knewIt ? 'high' : 'low',
      timeTaken: 5 // Rapid recall assumes quick response
    }]
    setResults(newResults)

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setShowAnswer(false)
    } else {
      setFinished(true)
      // Save session
      await recordQuizSession({
        topicId: null,
        subjectId: null,
        detailedAttempts: newResults,
        durationMinutes: 5
      })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  if (finished) {
    const known = results.filter(r => r.selectedAnswer === r.correctAnswer).length
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white p-12 rounded-3xl card-shadow border border-slate-100 text-center max-w-lg w-full">
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Rapid Session Over</h2>
          <p className="text-slate-500 mb-8 font-medium">You recalled {known} out of {questions.length} facts correctly.</p>
          <div className="flex gap-4">
            <button onClick={() => router.push('/dashboard')} className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <Home className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => window.location.reload()} className="flex-1 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all card-shadow flex items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5" /> Restart
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center justify-center">
      <Toaster richColors />
      
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
          <span>Recall Progress</span>
          <span>{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex + (showAnswer ? '-ans' : '-q')}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-2xl bg-white rounded-3xl p-10 md:p-14 card-shadow border border-slate-100 flex flex-col items-center text-center min-h-[400px]"
        >
          <div className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
            Question Concept
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-12">
            {currentQ.question}
          </h2>

          {!showAnswer ? (
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-auto group bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl active:scale-95"
            >
              <Eye className="w-6 h-6 group-hover:animate-pulse" /> Show Answer
            </button>
          ) : (
            <div className="w-full mt-auto">
              <div className="p-6 bg-teal-50 border border-teal-100 rounded-2xl mb-10">
                <p className="text-teal-900 font-bold text-lg mb-2">Correct Answer: {currentQ[`option_${currentQ.correct_answer.toLowerCase()}`]}</p>
                <p className="text-teal-700 text-sm leading-relaxed">{currentQ.explanation}</p>
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => handleResponse(false)}
                  className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 font-black rounded-2xl transition-all"
                >
                  Forgot
                </button>
                <button
                  onClick={() => handleResponse(true)}
                  className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Got it!
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-12 text-slate-400 font-medium flex items-center gap-2">
        <Brain className="w-5 h-5" /> Focused on Active Recall for high-yield facts.
      </p>
    </div>
  )
}
