'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Timer, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  FastForward,
  Info,
  Award,
  Zap
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { recordMockExamResult } from '@/app/actions/study-actions'

const EXAM_QUOTES = [
  "Remember: FCPS examiners once failed too. Probably. 😏",
  "You vs. 100 MCQs. May the odds be ever in your favor. 🎯",
  "Deep breaths. You've survived worse. Like Biochemistry lectures. 💀",
  "Pro tip: When in doubt, pick the longest option. (Don't actually.) 🤫",
]

export default function MockExamPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [examStarted, setExamStarted] = useState(false)
  const [stats, setStats] = useState({ score: 0, accuracy: 0, subjectBreakdown: [], weakAreas: [] })
  const [examMode, setExamMode] = useState('full') // 'mini' or 'full'
  const [paperFilter, setPaperFilter] = useState(0) // 0 = both, 1 = paper1, 2 = paper2
  const [timeLeft, setTimeLeft] = useState(0)
  const [examFinished, setExamFinished] = useState(false)
  const examStartTimeRef = useRef(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadQuestions() {
      setLoading(true)
      const limit = examMode === 'mini' ? 20 : 100
      let query = supabase
        .from('mcqs')
        .select('*, subjects(name)')
        .eq('is_published', true)
      
      if (paperFilter > 0) {
        query = query.eq('paper_number', paperFilter)
      }
      
      const { data, error } = await query.limit(limit)

      if (data && data.length > 0) {
        // Shuffle questions
        const shuffled = data.sort(() => Math.random() - 0.5)
        setQuestions(shuffled)
        setTimeLeft(examMode === 'mini' ? 25 * 60 : 120 * 60)
      } else {
        toast.error('Not enough MCQs found for this selection.')
      }
      setLoading(false)
    }
    loadQuestions()
  }, [examMode, paperFilter])

  useEffect(() => {
    let timer
    if (examStarted && !examFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      finishExam()
    }
    return () => clearInterval(timer)
  }, [examStarted, examFinished, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startExam = () => {
    if (questions.length === 0) {
      toast.error('No questions loaded')
      return
    }
    examStartTimeRef.current = Date.now()
    setExamStarted(true)
  }

  const handleSelect = (letter) => {
    setUserAnswers({ ...userAnswers, [currentIndex]: letter })
  }

  const finishExam = async () => {
    setExamFinished(true)
    const timeTaken = examStartTimeRef.current 
      ? Math.round((Date.now() - examStartTimeRef.current) / 60000) 
      : 120

    try {
      const result = await recordMockExamResult({
        questions,
        userAnswers,
        paperNumber: paperFilter || 1,
        timeTakenMinutes: timeTaken
      })

      if (result.success) {
        setStats({
          score: result.score,
          accuracy: result.accuracy,
          subjectBreakdown: result.subjectBreakdown || [],
          weakAreas: result.weakAreas || []
        })
      } else {
        // Fallback local calculation
        let score = 0
        questions.forEach((q, idx) => {
          if (userAnswers[idx] === q.correct_answer) score++
        })
        setStats({ score, accuracy: Math.round((score / questions.length) * 100), subjectBreakdown: [], weakAreas: [] })
      }
    } catch (err) {
      console.error('Failed to save mock exam:', err)
      let score = 0
      questions.forEach((q, idx) => {
        if (userAnswers[idx] === q.correct_answer) score++
      })
      setStats({ score, accuracy: Math.round((score / questions.length) * 100), subjectBreakdown: [], weakAreas: [] })
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  if (!examStarted) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Toaster richColors />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 md:p-10 card-shadow border border-slate-100"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
              <Award className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">Exam Simulator</h1>
            <p className="text-slate-500 text-base max-w-lg mx-auto">
              Simulate the real CPSP exam experience. Choose your paper and mode below.
            </p>
          </div>

          {/* Motivational Quote */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 mb-8 text-center">
            <p className="text-amber-800 text-sm font-medium italic">
              {EXAM_QUOTES[Math.floor(Math.random() * EXAM_QUOTES.length)]}
            </p>
          </div>

          {/* Paper Selection */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-3">Select Paper</h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 0, label: 'Both Papers', color: 'slate' },
                { value: 1, label: 'Paper I — General', color: 'blue' },
                { value: 2, label: 'Paper II — Specialty', color: 'teal' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPaperFilter(opt.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    paperFilter === opt.value 
                      ? opt.color === 'blue' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : opt.color === 'teal' ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                        : 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <button 
              onClick={() => setExamMode('mini')}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${examMode === 'mini' ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-100 hover:border-blue-200'}`}
            >
               <div className="flex items-center gap-3 text-slate-900 font-bold mb-2 text-lg">
                 <Zap className="w-5 h-5 text-amber-500" /> Mini Mock
               </div>
               <p className="text-slate-500 font-medium mb-3 text-sm">Best for daily focused sessions.</p>
               <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Info className="w-3 h-3" /> 20 MCQs</span>
                 <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> 25 Mins</span>
               </div>
            </button>

            <button 
              onClick={() => setExamMode('full')}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${examMode === 'full' ? 'border-blue-600 bg-blue-50/30 shadow-sm' : 'border-slate-100 hover:border-blue-200'}`}
            >
               <div className="flex items-center gap-3 text-slate-900 font-bold mb-2 text-lg">
                 <Award className="w-5 h-5 text-blue-600" /> Full Simulation
               </div>
               <p className="text-slate-500 font-medium mb-3 text-sm">Complete CPSP exam experience.</p>
               <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Info className="w-3 h-3" /> 100 MCQs</span>
                 <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> 120 Mins</span>
               </div>
            </button>
          </div>

          <div className="text-center">
            <button 
              onClick={startExam}
              disabled={loading || questions.length === 0}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Start {examMode === 'mini' ? 'Mini Mock' : 'Full Exam'}
              {paperFilter > 0 && ` — Paper ${paperFilter}`}
            </button>
            <p className="text-xs text-slate-400 mt-3 font-medium">{questions.length} questions loaded</p>
          </div>
        </motion.div>
      </div>
    )
  }

  if (examFinished) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-10 card-shadow border border-slate-100 text-center"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-black shadow-lg">
            {stats.accuracy}%
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Exam Results</h2>
          <p className="text-slate-500 text-lg mb-8 font-medium">
            You answered {stats.score} correctly out of {questions.length} questions.
          </p>
          
          {/* Subject-wise Breakdown */}
          {stats.subjectBreakdown.length > 0 && (
            <div className="text-left mb-8">
              <h3 className="font-bold text-slate-900 mb-4">Subject-wise Performance</h3>
              <div className="space-y-3">
                {stats.subjectBreakdown.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="text-sm text-slate-500 ml-2">{s.correct}/{s.total}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                      s.accuracy >= 70 ? 'bg-teal-100 text-teal-700' : 
                      s.accuracy >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {s.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak Areas Alert */}
          {stats.weakAreas.length > 0 && (
            <div className="text-left mb-8 p-4 bg-orange-50 border border-orange-100 rounded-xl">
              <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Areas Needing Improvement
              </h4>
              <ul className="text-sm text-orange-700 space-y-1">
                {stats.weakAreas.map((w, i) => (
                  <li key={i}>{w.name} — {w.accuracy}% accuracy</li>
                ))}
              </ul>
            </div>
          )}

          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
      <Toaster richColors />
      
      {/* Quiz Sidebar (Desktop focus) */}
      <aside className="w-full md:w-80 shrink-0">
        <div className="bg-white rounded-2xl p-6 card-shadow border border-slate-100 sticky top-8">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 text-slate-900 font-black">
               <Timer className={`w-5 h-5 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
               <span className="text-xl">{formatTime(timeLeft)}</span>
             </div>
             <button onClick={finishExam} className="text-red-600 font-bold hover:underline">Submit Exam</button>
           </div>
           
           <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
             <div className="grid grid-cols-5 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 w-10 text-xs font-bold rounded-lg transition-all border ${
                      currentIndex === idx 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : userAnswers[idx] 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
             </div>
           </div>
        </div>
      </aside>

      {/* Question Platform */}
      <main className="flex-1">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 card-shadow border border-slate-100 relative min-h-[500px] flex flex-col"
        >
          <div className="flex items-center gap-2 text-blue-600 font-bold text-sm mb-4 uppercase tracking-widest">
            {currentQ.subjects?.name || 'General Topic'}
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug mb-10">
            {currentQ.question}
          </h2>

          <div className="space-y-4 flex-1">
             {['A', 'B', 'C', 'D'].map(letter => {
               const key = `option_${letter.toLowerCase()}`
               if (!currentQ[key]) return null
               return (
                 <button
                   key={letter}
                   onClick={() => handleSelect(letter)}
                   className={`w-full text-left p-6 rounded-xl border-2 transition-all flex items-center group ${
                     userAnswers[currentIndex] === letter
                       ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                       : 'border-slate-50 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                   }`}
                 >
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 font-bold transition-colors ${
                     userAnswers[currentIndex] === letter 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100'
                   }`}>
                     {letter}
                   </div>
                   <span className="font-medium text-lg">{currentQ[key]}</span>
                 </button>
               )
             })}
          </div>

          <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100">
             <button
               onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
               disabled={currentIndex === 0}
               className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 disabled:opacity-30 transition-colors"
             >
               <ChevronLeft className="w-5 h-5" /> Previous
             </button>
             
             <button
               onClick={() => {
                 if (currentIndex === questions.length - 1) finishExam()
                 else setCurrentIndex(prev => prev + 1)
               }}
               className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg active:scale-95"
             >
               {currentIndex === questions.length - 1 ? 'Finish Exam' : 'Save & Next'}
               <ChevronRight className="w-5 h-5" />
             </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
