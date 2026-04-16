'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast, Toaster } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2, ArrowRight, Sparkles, CheckCircle2, XCircle, Clock, Zap, Pin, Eye, EyeOff, Lightbulb, BrainCircuit, MessageSquareQuote, Flag } from 'lucide-react'
import { generateTopicMCQs } from '@/app/actions/ai-actions'
import { recordQuizSession, generateExplanation, generateMnemonic } from '@/app/actions/study-actions'

function QuizContent() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [detailedAttempts, setDetailedAttempts] = useState([])
  const [startTime] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [loadingAi, setLoadingAi] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [confidence, setConfidence] = useState('medium')
  const [distractionFree, setDistractionFree] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [aiExplanation, setAiExplanation] = useState(null)
  const [aiMnemonic, setAiMnemonic] = useState(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const topicId = searchParams.get('topic')
  const subjectId = searchParams.get('subject')

  useEffect(() => {
    loadQuestions()
  }, [topicId, subjectId])

  async function loadQuestions() {
    setLoading(true)
    
    let query = supabase
      .from('mcqs')
      .select('*')
      .eq('is_published', true)
      .limit(20)

    if (topicId) {
      query = query.eq('topic_id', topicId)
    } else if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }
      
    const { data, error } = await query
      
    if (!error && data && data.length > 0) {
      const shuffled = data.sort(() => 0.5 - Math.random())
      setQuestions(shuffled)
    }
    
    setLoading(false)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const toastId = toast.loading('Gemini AI is generating 20 high-yield MCQs for this topic...')
    
    try {
      const result = await generateTopicMCQs(topicId)
      if (result.success) {
        toast.success(`Generated ${result.count} new MCQs!`, { id: toastId })
        loadQuestions()
      } else {
        toast.error(result.error || 'Failed to generate MCQs', { id: toastId })
      }
    } catch (err) {
      toast.error('Unexpected error', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  const handleSelect = (letter) => {
    if (isAnswered) return
    setSelectedOption(letter)
  }

  const handleSubmit = () => {
    if (!selectedOption) return
    
    setIsAnswered(true)
    const currentQ = questions[currentIndex]
    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000)
    
    setDetailedAttempts(prev => [...prev, {
      questionId: currentQ.id,
      topicId: currentQ.topic_id,
      subjectId: currentQ.subject_id,
      selectedAnswer: selectedOption,
      correctAnswer: currentQ.correct_answer,
      confidence,
      timeTaken
    }])
    
    if (selectedOption === currentQ.correct_answer) {
       setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    setSelectedOption(null)
    setIsAnswered(false)
    setConfidence('medium')
    setAiExplanation(null)
    setAiMnemonic(null)
    setQuestionStartTime(Date.now())
    setIsBookmarked(false)
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      finishQuiz()
    }
  }

  const handleMagicExplanation = async () => {
    setLoadingAi(true)
    try {
      const result = await generateExplanation(questions[currentIndex].id)
      if (result) {
        setAiExplanation(result)
      }
    } catch (e) {
      console.error("AI Insight Error:", e)
    }
    setLoadingAi(false)
  }

  const handleMagicMnemonic = async () => {
    setLoadingAi(true)
    try {
      const result = await generateMnemonic(questions[currentIndex].question.substring(0, 50))
      if (result) {
        setAiMnemonic(result)
      }
    } catch (e) {
      console.error("AI Mnemonic Error:", e)
    }
    setLoadingAi(false)
  }

  const handleReportError = async () => {
    // In a real app, this would save to a 'reported_issues' table
    alert("Issue reported! Our medical team will review this MCQ. Thank you for helping improve FCPS Prep.")
  }

   const finishQuiz = async () => {
    setLoading(true)
    const durationMinutes = Math.round((Date.now() - startTime) / 60000)
    
    try {
      const result = await recordQuizSession({
        topicId,
        subjectId: questions[0]?.subject_id,
        detailedAttempts,
        durationMinutes
      })
      if (result.success) {
        setScore(result.score)
      }
    } catch (e) {
      console.error('Failed to save quiz results', e)
    }
    
    setQuizFinished(true)
    setLoading(false)
  }

  if (loading) {
     return (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
     )
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center bg-white rounded-3xl mt-12 card-shadow border border-slate-100">
        <Toaster richColors />
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">No MCQs Available</h2>
        <p className="text-slate-500 mb-8">
          There are currently no practice questions available for this selection. {(topicId) ? "Use our AI engine to instantly generate high-quality MCQs tailored for this topic." : "Please select a specific topic from the subjects page to generate AI questions."}
        </p>
        
        {topicId ? (
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 disabled:opacity-70 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mx-auto card-shadow w-full max-w-md"
          >
            {generating ? (
               <><Loader2 className="w-5 h-5 animate-spin" /> Generating MCQs...</>
            ) : (
               <><Sparkles className="w-5 h-5" /> Generate MCQs via AI</>
            )}
          </button>
        ) : (
          <button 
            onClick={() => router.push('/subjects')}
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mx-auto card-shadow w-full max-w-md"
          >
            Browse Subjects
          </button>
        )}
      </div>
    )
  }

  if (quizFinished) {
    const accuracy = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl card-shadow border border-slate-100 mt-12 text-center">
         <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 text-white text-3xl font-black bg-gradient-to-tr from-blue-600 to-teal-400 shadow-lg">
           {accuracy}%
         </div>
         <h2 className="text-3xl font-black text-slate-900 mb-2">Quiz Complete!</h2>
         <p className="text-slate-500 font-medium text-lg mb-8">You scored {score} out of {questions.length}.</p>
         
         <div className="flex gap-4 justify-center">
           <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors">
             Go to Dashboard
           </button>
           <button onClick={() => window.location.reload()} className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-xl transition-colors card-shadow">
             Retake Quiz
           </button>
         </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]
  
  const getOptionClass = (letter) => {
    let base = "w-full text-left p-5 rounded-xl border-2 transition-all flex items-center mb-3 "
    
    if (!isAnswered) {
      return base + (selectedOption === letter 
        ? "border-blue-600 bg-blue-50/50 text-blue-900" 
        : "border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-700")
    }
    
    if (letter === currentQ.correct_answer) {
       return base + "border-teal-500 bg-teal-50 text-teal-900"
    }
    if (selectedOption === letter && selectedOption !== currentQ.correct_answer) {
       return base + "border-red-500 bg-red-50 text-red-900"
    }
    
    return base + "border-slate-100 opacity-50 bg-slate-50 text-slate-500"
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      
      {!distractionFree && (
        <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl card-shadow border border-slate-100 animate-in fade-in slide-in-from-top-2">
          <div className="font-bold text-slate-600">Question {currentIndex + 1} of {questions.length}</div>
          <div className="font-bold text-blue-600 flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-slate-400">
               <Clock className="w-4 h-4" />
               <span className="tabular-nums">
                 {Math.round((Date.now() - questionStartTime) / 1000)}s
               </span>
             </div>
             <span>Score: {score}</span>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-3xl p-8 md:p-10 card-shadow border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-bl-xl uppercase tracking-wider">
          {currentQ.difficulty || 'Medium'}
        </div>
        
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 leading-snug mb-8 mt-2">
          {currentQ.question}
        </h1>

        {currentQ.has_image && currentQ.image_url && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
            <img 
              src={currentQ.image_url} 
              alt="Clinical Scenario" 
              className="w-full h-auto max-h-[400px] object-contain mx-auto"
            />
          </div>
        )}
        
        <div className="space-y-1">
          {['A', 'B', 'C', 'D'].map((letter) => {
             const key = `option_${letter.toLowerCase()}`
             if (!currentQ[key]) return null
             
             return (
               <button
                 key={letter}
                 onClick={() => handleSelect(letter)}
                 className={getOptionClass(letter)}
               >
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-4 font-bold text-sm transition-colors ${
                   isAnswered 
                    ? letter === currentQ.correct_answer 
                       ? 'bg-teal-500 text-white' 
                       : (selectedOption === letter ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500')
                    : selectedOption === letter 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100'
                 }`}>
                   {letter}
                 </div>
                 <span className="font-medium text-[15px]">{currentQ[key]}</span>
                 
                 {isAnswered && letter === currentQ.correct_answer && (
                   <CheckCircle2 className="w-5 h-5 ml-auto text-teal-600 shrink-0" />
                 )}
                 {isAnswered && selectedOption === letter && selectedOption !== currentQ.correct_answer && (
                   <XCircle className="w-5 h-5 ml-auto text-red-600 shrink-0" />
                 )}
               </button>
             )
          })}
        </div>
      </div>
      
      {isAnswered && (
        <div className={`p-6 rounded-2xl mb-6 border ${selectedOption === currentQ.correct_answer ? 'bg-teal-50 border-teal-100 text-teal-900' : 'bg-orange-50 border-orange-100 text-orange-900'}`}>
          <h3 className="font-bold flex items-center mb-2">
            {selectedOption === currentQ.correct_answer ? '✅ Correct!' : '❌ Incorrect.'} 
            <span className="ml-2 text-sm opacity-70">Explanation:</span>
          </h3>
          <p className="text-sm md:text-[15px] leading-relaxed opacity-90 mb-4">{currentQ.explanation}</p>
          
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-teal-100">
             {!aiExplanation && (
               <button 
                 onClick={handleMagicExplanation}
                 disabled={loadingAi}
                 className="flex items-center gap-2 px-4 py-2 bg-white text-teal-700 border border-teal-200 rounded-lg text-xs font-bold hover:bg-teal-100 transition-all disabled:opacity-50"
               >
                  {loadingAi ? <Loader2 className="w-3 h-3 animate-spin"/> : <Lightbulb className="w-3 h-3"/>}
                  AI Deep Explanation
               </button>
             )}
             {!aiMnemonic && (
               <button 
                 onClick={handleMagicMnemonic}
                 disabled={loadingAi}
                 className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50"
               >
                  {loadingAi ? <Loader2 className="w-3 h-3 animate-spin"/> : <BrainCircuit className="w-3 h-3"/>}
                  Generate Mnemonic
               </button>
             )}
          </div>

          {aiExplanation && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-2 text-blue-800 font-black text-xs uppercase mb-2">
                 <MessageSquareQuote className="w-4 h-4" /> AI Insight
              </div>
              <p className="text-sm text-blue-900 leading-relaxed mb-3">{aiExplanation.explanation_correct}</p>
              <div className="p-3 bg-white border border-blue-100 rounded-lg">
                 <span className="text-xs font-bold text-blue-400 block mb-1">KEY TAKEAWAY</span>
                 <p className="text-sm font-bold text-blue-900">{aiExplanation.key_takeaway}</p>
              </div>
            </motion.div>
          )}

          {aiMnemonic && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex items-center gap-2 text-amber-800 font-black text-xs uppercase mb-2">
                 <Zap className="w-4 h-4" /> Memory Aid (Mnemonic)
              </div>
              <p className="text-lg font-black text-amber-900 tracking-wider mb-2">{aiMnemonic.mnemonic}</p>
              <p className="text-xs text-amber-700 italic border-t border-amber-100 pt-2">{aiMnemonic.breakdown}</p>
            </motion.div>
          )}

          {currentQ.reference_book && (
             <div className="flex justify-between items-center mt-4">
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest flex items-center">
                  Ref: {currentQ.reference_book}
                </p>
                <button 
                  onClick={handleReportError}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1"
                >
                  <Flag className="w-3 h-3" /> Report Error
                </button>
             </div>
          )}
        </div>
      )}

      {/* Controls & Metrics */}
      <div className="flex flex-col gap-6">
        
        {/* Confidence Selector — Only show before submitting */}
        {!isAnswered && selectedOption && (
          <div className="bg-white p-6 rounded-2xl card-shadow border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> How confident are you?
            </h4>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((c) => (
                <button
                  key={c}
                  onClick={() => setConfidence(c)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold capitalize transition-all border-2 ${
                    confidence === c
                      ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center bg-white p-4 rounded-2xl card-shadow border border-slate-100">
           {/* Secondary Actions */}
           <div className="flex gap-2">
             <button 
                onClick={() => setDistractionFree(!distractionFree)}
                className={`p-3 rounded-xl transition-all ${distractionFree ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
                title={distractionFree ? "Normal Mode" : "Distraction-Free Mode"}
             >
               {distractionFree ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
             </button>
             <button 
                className={`p-3 rounded-xl transition-all ${isBookmarked ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}
                onClick={() => setIsBookmarked(!isBookmarked)}
             >
               <Pin className="w-5 h-5" />
             </button>
           </div>

           {/* Primary Button */}
           {!isAnswered ? (
             <button
               onClick={handleSubmit}
               disabled={!selectedOption}
               className="bg-slate-900 disabled:opacity-50 hover:bg-slate-800 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-md"
             >
               Check Answer
             </button>
           ) : (
             <button
               onClick={handleNext}
               className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold transition-all flex items-center gap-2 shadow-md shadow-blue-500/20"
             >
               {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
               <ArrowRight className="w-5 h-5" />
             </button>
           )}
        </div>
      </div>

    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[50vh]">
         <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    }>
      <QuizContent />
    </Suspense>
  )
}
