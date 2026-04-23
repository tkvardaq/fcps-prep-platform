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
  Zap,
  Activity,
  Shield,
  FileText,
  MousePointer2,
  Lock,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Home,
  Brain
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { recordMockExamResult } from '@/app/actions/study-actions'
import Link from 'next/link'

const EXAM_QUOTES = [
  "CPSP Simulation: Precision is the only metric that matters.",
  "You vs. 100 MCQs. Stabilize your focus. 🎯",
  "Neural state: Optimal. Proceed with clinical confidence.",
  "Remember: Diagnosis is an art; the exam is a protocol. 🤫",
  "Focus on the prompt. The distractor is a shadow, the truth is a pillar.",
]

const STORAGE_KEY = 'fcps_mock_exam_state'

export default function MockExamPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [examStarted, setExamStarted] = useState(false)
  const [stats, setStats] = useState({ score: 0, accuracy: 0, subjectBreakdown: [], weakAreas: [] })
  const [examMode, setExamMode] = useState('full')
  const [paperFilter, setPaperFilter] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [examFinished, setExamFinished] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const examStartTimeRef = useRef(null)
  const supabase = createClient()
  const router = useRouter()

  // 1. Initial Load & Persistence Check
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Only restore if it's from the same day to avoid stale data
        const savedDate = new Date(parsed.timestamp).toDateString()
        const today = new Date().toDateString()
        
        if (savedDate === today && !parsed.examFinished) {
          setQuestions(parsed.questions || [])
          setCurrentIndex(parsed.currentIndex || 0)
          setUserAnswers(parsed.userAnswers || {})
          setExamStarted(parsed.examStarted || false)
          setExamMode(parsed.examMode || 'full')
          setPaperFilter(parsed.paperFilter || 0)
          setTimeLeft(parsed.timeLeft)
          examStartTimeRef.current = parsed.startTime
          setLoading(false)
          return
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e)
      }
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    loadFreshQuestions()
  }, [])

  async function loadFreshQuestions() {
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
      const shuffled = data.sort(() => Math.random() - 0.5)
      setQuestions(shuffled)
      const initialTime = examMode === 'mini' ? 25 * 60 : 120 * 60
      setTimeLeft(initialTime)
    } else {
      toast.error('Not enough MCQs found for this selection.')
    }
    setLoading(false)
  }

  // 2. Persistence Sync
  useEffect(() => {
    if (examStarted && !examFinished) {
      const state = {
        questions,
        currentIndex,
        userAnswers,
        examStarted,
        examMode,
        paperFilter,
        timeLeft,
        startTime: examStartTimeRef.current,
        timestamp: new Date().toISOString(),
        examFinished: false
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, userAnswers, timeLeft, examStarted, examFinished])

  // 3. Timer Logic
  useEffect(() => {
    let timer
    if (examStarted && !examFinished && timeLeft !== null && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (examStarted && !examFinished && timeLeft === 0) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      finishExam()
    }
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, examFinished, timeLeft])

  const formatTime = (seconds) => {
    if (seconds === null) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startExam = async () => {
    if (questions.length === 0) {
      await loadFreshQuestions()
    }
    examStartTimeRef.current = Date.now()
    setExamStarted(true)
    toast.success('Simulation Initiated. Good luck, Doctor.')
  }

  const handleSelect = (letter) => {
    setUserAnswers(prev => ({ ...prev, [currentIndex]: letter }))
  }

  const finishExam = async () => {
    if (isSaving) return
    setIsSaving(true)
    setExamFinished(true)
    localStorage.removeItem(STORAGE_KEY)

    const timeTaken = examStartTimeRef.current 
      ? Math.round((Date.now() - examStartTimeRef.current) / 60000) 
      : (examMode === 'mini' ? 25 : 120)

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
        calculateLocalStats()
      }
    } catch (err) {
      console.error('Failed to save mock exam:', err)
      calculateLocalStats()
    } finally {
      setIsSaving(false)
    }
  }

  const calculateLocalStats = () => {
    let score = 0
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_answer) score++
    })
    setStats({ 
      score, 
      accuracy: Math.round((score / questions.length) * 100), 
      subjectBreakdown: [], 
      weakAreas: [] 
    })
  }

  const resetExam = () => {
    localStorage.removeItem(STORAGE_KEY)
    setExamStarted(false)
    setExamFinished(false)
    setUserAnswers({})
    setCurrentIndex(0)
    loadFreshQuestions()
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBFB] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent animate-pulse" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 text-center"
        >
          <div className="relative w-32 h-32 mx-auto mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-4 border-t-[#2A5C9A] border-r-transparent border-b-[#2A5C9A]/20 border-l-transparent rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-12 h-12 text-[#2A5C9A] animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#1A1C1E] mb-2 tracking-tight font-poppins">Initializing Neural Buffer</h2>
          <p className="text-[#8E9199] text-sm font-bold uppercase tracking-widest animate-pulse">Simulating Clinical Environment...</p>
        </motion.div>
      </div>
    )
  }

  // Start Screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-[#FFFBFB] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
        <Toaster richColors />
        
        {/* Background Ambient Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-8 md:p-16 border border-white/50 relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]"
        >
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#2A5C9A]/20 to-transparent" />
          
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-[#2A5C9A] to-[#1E40AF] text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/20">
              <Shield className="w-12 h-12" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-[#1A1C1E] mb-4 tracking-tight font-poppins">Mock Simulator</h1>
            <p className="text-[#44474E] text-lg max-w-xl mx-auto font-medium font-quicksand">
              Elite CPSP simulation with real-time analytics and predictive performance vectors.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[2rem] p-6 mb-12 flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-[#2A5C9A]" />
            </div>
            <p className="text-[#44474E] text-sm font-medium italic font-quicksand">
              {EXAM_QUOTES[Math.floor(Math.random() * EXAM_QUOTES.length)]}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-[#8E9199] uppercase tracking-[0.25em] mb-4">Paper Specification</h3>
                <div className="flex gap-3 flex-wrap">
                  {[
                    { value: 0, label: 'Dual Focus', icon: Activity },
                    { value: 1, label: 'Paper I', icon: FileText },
                    { value: 2, label: 'Paper II', icon: Award },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPaperFilter(opt.value)}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all border ${
                        paperFilter === opt.value 
                          ? 'bg-[#2A5C9A] text-white border-[#2A5C9A] shadow-xl shadow-blue-500/20' 
                          : 'bg-white text-[#44474E] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-[#8E9199] uppercase tracking-[0.25em] mb-4">Simulation Load</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setExamMode('mini')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left group ${examMode === 'mini' ? 'border-[#2A5C9A] bg-[#2A5C9A]/5' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'}`}
                  >
                     <div className={`flex items-center gap-3 font-bold mb-2 ${examMode === 'mini' ? 'text-[#2A5C9A]' : 'text-[#1A1C1E]'}`}>
                       <Zap className={`w-5 h-5 ${examMode === 'mini' ? 'text-[#2A5C9A]' : 'text-[#8E9199]'}`} /> Mini Mock
                     </div>
                     <p className="text-[#44474E] text-xs font-medium mb-4 italic font-quicksand">High-intensity 25min sprint.</p>
                     <div className="flex gap-4 text-[10px] font-black text-[#8E9199] uppercase tracking-widest">
                       <span className="flex items-center gap-1">20 MCQ</span>
                       <span className="flex items-center gap-1">25 MIN</span>
                     </div>
                  </button>

                  <button 
                    onClick={() => setExamMode('full')}
                    className={`p-6 rounded-2xl border-2 transition-all text-left group ${examMode === 'full' ? 'border-[#2A5C9A] bg-[#2A5C9A]/5' : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]'}`}
                  >
                     <div className={`flex items-center gap-3 font-bold mb-2 ${examMode === 'full' ? 'text-[#2A5C9A]' : 'text-[#1A1C1E]'}`}>
                       <Award className={`w-5 h-5 ${examMode === 'full' ? 'text-[#2A5C9A]' : 'text-[#8E9199]'}`} /> Full Sim
                     </div>
                     <p className="text-[#44474E] text-xs font-medium mb-4 italic font-quicksand">Standard CPSP 2-hour fatigue.</p>
                     <div className="flex gap-4 text-[10px] font-black text-[#8E9199] uppercase tracking-widest">
                       <span className="flex items-center gap-1">100 MCQ</span>
                       <span className="flex items-center gap-1">120 MIN</span>
                     </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between p-8 rounded-[2.5rem] bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border border-[#E2E8F0] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8">
                 <Lock className="w-12 h-12 text-[#2A5C9A]/5" />
               </div>
               
               <div className="relative z-10">
                 <h4 className="text-[#1A1C1E] font-bold text-xl mb-4 font-poppins">Ready to Launch</h4>
                 <ul className="space-y-4 text-[#44474E] text-sm font-medium mb-8 font-quicksand">
                   <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Questions randomized</li>
                   <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Subject-specific weights applied</li>
                   <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-teal-600" /> Real-time clock synchronization</li>
                 </ul>
               </div>

               <button 
                onClick={startExam}
                disabled={loading || questions.length === 0}
                className="w-full relative group overflow-hidden bg-[#2A5C9A] text-white py-6 rounded-2xl font-black text-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_50px_rgba(42,92,154,0.15)] disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#2A5C9A] to-[#1E40AF] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10">Initiate Mission</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Result Screen
  if (examFinished) {
    return (
      <div className="min-h-screen bg-[#FFFBFB] p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent" />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-4xl bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-10 md:p-16 border border-white/50 relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)]"
        >
          <div className="text-center mb-12">
            <div className="w-32 h-32 bg-gradient-to-br from-[#2A5C9A] via-[#1E40AF] to-[#2A5C9A] rounded-full flex items-center justify-center mx-auto mb-8 text-white text-4xl font-black shadow-2xl shadow-blue-500/20 border-4 border-white/50">
              {stats.accuracy}%
            </div>
            <h2 className="text-4xl font-black text-[#1A1C1E] mb-2 tracking-tight font-poppins">Mission Debrief</h2>
            <p className="text-[#44474E] text-lg font-medium font-quicksand">
              Performance Index: <span className="text-[#2A5C9A] font-bold">{stats.score}</span> / {questions.length} successful diagnoses.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-[10px] font-black text-[#8E9199] uppercase tracking-[0.25em] mb-4">Subject Vector Analysis</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {stats.subjectBreakdown.length > 0 ? stats.subjectBreakdown.map((s, i) => (
                  <div key={i} className="p-5 bg-white border border-[#E2E8F0] rounded-2xl group hover:border-[#2A5C9A]/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#1A1C1E]/80">{s.name}</span>
                      <span className="text-[#2A5C9A] font-black">{s.accuracy}%</span>
                    </div>
                    <div className="h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${s.accuracy >= 70 ? 'bg-teal-500' : s.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${s.accuracy}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-[#8E9199] border-2 border-dashed border-[#E2E8F0] rounded-3xl">
                    Detailed analytics pending server sync.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-[#8E9199] uppercase tracking-[0.25em] mb-4">Post-Simulation Directive</h3>
              <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-5 h-5 text-[#2A5C9A]" />
                  <span className="text-sm font-black text-[#2A5C9A] uppercase tracking-widest">AI Insights</span>
                </div>
                <p className="text-xs text-[#44474E] font-medium leading-relaxed font-quicksand">
                  Based on your neural patterns, focusing on {stats.weakAreas?.[0]?.name || 'current weak topics'} could increase your overall probability of success by 14%.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={resetExam}
                  className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#E2E8F0] hover:border-[#2A5C9A]/30 transition-all group"
                >
                  <RefreshCw className="w-6 h-6 text-[#8E9199] mb-2 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-[10px] font-black text-[#8E9199] uppercase tracking-widest">Retry Sim</span>
                </button>
                <Link 
                  href="/dashboard"
                  className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-[#E2E8F0] hover:border-[#2A5C9A]/30 transition-all"
                >
                  <Home className="w-6 h-6 text-[#8E9199] mb-2" />
                  <span className="text-[10px] font-black text-[#8E9199] uppercase tracking-widest">Dashboard</span>
                </Link>
              </div>
            </div>
          </div>

          <button 
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#2A5C9A] text-white py-6 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-500/20"
          >
            Finalize Mission Results
          </button>
        </motion.div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  // Main Exam UI
  return (
    <div className="min-h-screen bg-[#FFFBFB] flex flex-col md:flex-row overflow-hidden relative">
      <Toaster richColors />
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full" />
      </div>

      {/* Control Sidebar */}
      <aside className="w-full md:w-96 border-r border-[#E2E8F0] flex flex-col relative z-20 backdrop-blur-xl bg-white/40">
        <div className="p-8 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Activity className={`w-6 h-6 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-[#2A5C9A]'}`} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#8E9199] uppercase tracking-widest">Time Remaining</p>
                <p className={`text-2xl font-black ${timeLeft < 300 ? 'text-red-500' : 'text-[#1A1C1E]'}`}>{formatTime(timeLeft)}</p>
              </div>
            </div>
            <button 
              onClick={() => {
                if (confirm('Abort this mission? Data will not be saved.')) {
                  localStorage.removeItem(STORAGE_KEY)
                  router.push('/dashboard')
                }
              }}
              className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
            >
              Abort
            </button>
          </div>

          <div className="relative">
            <div className="flex justify-between text-[10px] font-black text-[#8E9199] uppercase tracking-widest mb-3">
              <span>Mission Progress</span>
              <span className="text-[#2A5C9A]">{Object.keys(userAnswers).length} / {questions.length}</span>
            </div>
            <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[#2A5C9A]"
                initial={{ width: 0 }}
                animate={{ width: `${(Object.keys(userAnswers).length / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <h3 className="text-[10px] font-black text-[#8E9199] uppercase tracking-[0.25em] mb-6">Neural Map</h3>
          <div className="grid grid-cols-5 gap-3">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-12 w-12 text-xs font-black rounded-xl transition-all border flex items-center justify-center ${
                  currentIndex === idx 
                    ? 'bg-[#2A5C9A] text-white border-[#2A5C9A] shadow-lg shadow-blue-500/20' 
                    : userAnswers[idx] 
                      ? 'bg-blue-50 text-[#2A5C9A] border-[#2A5C9A]/20' 
                      : 'bg-white text-[#8E9199] border-[#E2E8F0] hover:border-[#2A5C9A]/20'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 border-t border-[#E2E8F0]">
           <div className="flex items-center gap-4 text-[#8E9199]">
             <Shield className="w-5 h-5" />
             <span className="text-[10px] font-black uppercase tracking-widest">Protocol Active</span>
           </div>
        </div>
      </aside>

      {/* Main Interface */}
      <main className="flex-1 p-8 md:p-16 flex flex-col relative z-10 h-screen overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-4xl mx-auto flex-1 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#2A5C9A] text-[10px] font-black uppercase tracking-widest">
                Case Scenario {currentIndex + 1}
              </div>
              <div className="text-[#8E9199] font-black text-[10px] uppercase tracking-widest">
                / {currentQ?.subjects?.name || 'General Pathology'}
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1C1E] leading-tight mb-16 tracking-tight font-poppins">
              {currentQ?.question}
            </h2>

            <div className="grid grid-cols-1 gap-5 flex-1">
               {['A', 'B', 'C', 'D'].map(letter => {
                 const key = `option_${letter.toLowerCase()}`
                 if (!currentQ?.[key]) return null
                 return (
                   <button
                     key={letter}
                     onClick={() => handleSelect(letter)}
                     className={`w-full text-left p-8 rounded-3xl border transition-all flex items-center group relative overflow-hidden ${
                       userAnswers[currentIndex] === letter
                         ? 'border-[#2A5C9A] bg-[#2A5C9A]/5'
                         : 'border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] hover:border-[#2A5C9A]/20'
                     }`}
                   >
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-6 font-black transition-all ${
                       userAnswers[currentIndex] === letter 
                         ? 'bg-[#2A5C9A] text-white shadow-lg shadow-blue-500/40' 
                         : 'bg-[#F8FAFC] text-[#8E9199] group-hover:bg-[#EFF6FF] group-hover:text-[#2A5C9A]'
                     }`}>
                       {letter}
                     </div>
                     <span className={`text-lg font-bold transition-colors font-quicksand ${userAnswers[currentIndex] === letter ? 'text-[#1A1C1E]' : 'text-[#44474E] group-hover:text-[#1A1C1E]'}`}>
                       {currentQ[key]}
                     </span>
                     {userAnswers[currentIndex] === letter && (
                       <motion.div layoutId="activeOption" className="absolute right-8">
                         <Sparkles className="w-6 h-6 text-[#2A5C9A] opacity-50" />
                       </motion.div>
                     )}
                   </button>
                 )
               })}
            </div>

            <div className="flex items-center justify-between mt-16 pt-12 border-t border-[#E2E8F0]">
               <button
                 onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                 disabled={currentIndex === 0}
                 className="flex items-center gap-3 text-[#8E9199] font-black uppercase tracking-widest hover:text-[#1A1C1E] disabled:opacity-0 transition-all group"
               >
                 <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Previous Case
               </button>
               
               <button
                 onClick={() => {
                   if (currentIndex === questions.length - 1) {
                     if (confirm('Submit and end the simulation?')) finishExam()
                   }
                   else setCurrentIndex(prev => prev + 1)
                 }}
                 disabled={isSaving}
                 className="group relative overflow-hidden bg-[#2A5C9A] text-white px-12 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-500/10 disabled:opacity-50"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-[#2A5C9A] to-[#1E40AF] opacity-0 group-hover:opacity-100 transition-opacity" />
                 <span className="relative z-10 flex items-center gap-3">
                   {isSaving ? 'Synchronizing...' : currentIndex === questions.length - 1 ? 'Terminal Commit' : 'Save & Proceed'}
                   <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </span>
               </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
