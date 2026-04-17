'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'sonner'
import { Loader2, ArrowRight } from 'lucide-react'
import { recordDiagnosticResult } from '@/app/actions/study-actions'
import { generateStudyPlan } from '@/app/actions/ai-actions'

export default function DiagnosticPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadQuestions() {
      // Fetch 35 real MCQs from DB, spread across subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id')
        .order('sort_order')

      if (!subjects || subjects.length === 0) {
        toast.error('No subjects found')
        setLoading(false)
        return
      }

      // Get ~4 MCQs per subject for diagnostic
      let allMCQs = []
      for (const sub of subjects) {
        const { data: mcqs } = await supabase
          .from('mcqs')
          .select('*, subjects(name)')
          .eq('subject_id', sub.id)
          .eq('is_published', true)
          .limit(4)
        
        if (mcqs) allMCQs.push(...mcqs)
      }

      // Shuffle and take up to 35
      allMCQs = allMCQs.sort(() => Math.random() - 0.5).slice(0, 35)
      setQuestions(allMCQs)
      setLoading(false)
    }
    
    loadQuestions()
  }, [])

  useEffect(() => {
    if (loading || submitting || questions.length === 0) return
    if (timeLeft === 0) {
      handleNext()
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, loading, submitting, questions.length])

  const handleSelect = (option) => {
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: option }))
  }

  const handleNext = () => {
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
      toast.error('Not authenticated')
      return
    }

    // Map answers to correct_answer (A,B,C,D) for each question
    const mappedAnswers = {}
    questions.forEach(q => {
      const selected = answers[q.id]
      if (selected) {
        // answers[q.id] stores the option text; map to letter
        if (selected === q.option_a) mappedAnswers[q.id] = 'A'
        else if (selected === q.option_b) mappedAnswers[q.id] = 'B'
        else if (selected === q.option_c) mappedAnswers[q.id] = 'C'
        else if (selected === q.option_d) mappedAnswers[q.id] = 'D'
        else mappedAnswers[q.id] = selected // Already a letter
      }
    })

    try {
      // Save diagnostic results and seed weak_topics
      toast.info('Analyzing your results...')
      const diagResult = await recordDiagnosticResult({ questions, answers: mappedAnswers })

      // Calculate weak and strong subjects from answers
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

      // Generate AI study plan
      const profile = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      const p = profile.data
      
      toast.info('Generating your personalized AI study plan...')
      const planResult = await generateStudyPlan(
        p?.exam_date || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0],
        p?.daily_study_hours || 4,
        p?.paper_focus || 'Both Papers',
        weakSubjects,
        strongSubjects
      )

      if (planResult?.success) {
        toast.success('Study plan generated! Redirecting...')
      } else {
        toast.warning('Plan generated with fallback data. You can regenerate later.')
      }
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      console.error('Diagnostic error:', err)
      toast.error('An error occurred. Redirecting to dashboard.')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center p-8 text-center max-w-md mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No MCQs Available</h2>
          <p className="text-slate-500 mb-6">MCQs need to be generated first. Visit Developer Tools in Settings to seed content.</p>
          <button onClick={() => router.push('/settings')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold">
            Go to Settings
          </button>
        </div>
      </div>
    )
  }

  if (submitting) {
    return (
      <div className="flex flex-col h-full min-h-[50vh] items-center justify-center p-8 text-center max-w-sm mx-auto">
        <Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-6 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Results...</h2>
        <p className="text-slate-600 tracking-tight">
          Building your personalized study schedule based on your diagnostic results.
        </p>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  const options = [currentQ.option_a, currentQ.option_b, currentQ.option_c, currentQ.option_d].filter(Boolean)
  const isSelected = (opt) => answers[currentQ.id] === opt

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 h-full">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl border border-slate-100 card-shadow">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-sm font-bold">
            Q: {currentIndex + 1} / {questions.length}
          </div>
          <div className="text-sm text-slate-500 font-medium">Diagnostic Mode · {currentQ.subjects?.name || ''}</div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-bold ${timeLeft <= 10 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {timeLeft}s
        </div>
      </div>

      {/* Question */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 card-shadow mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 leading-snug">
          {currentQ.question}
        </h1>

        <div className="space-y-3">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center ${
                isSelected(opt) 
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm' 
                  : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm ${
                isSelected(opt) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="font-medium text-[15px]">{opt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!answers[currentQ.id]}
          className="bg-slate-900 disabled:opacity-50 hover:bg-slate-800 disabled:hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl font-medium transition-all flex items-center gap-2"
        >
          {currentIndex === questions.length - 1 ? 'Submit & Analyze' : 'Next Question'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
    </div>
  )
}
