'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [examDate, setExamDate] = useState('')
  const [dailyHours, setDailyHours] = useState(4)
  const [paperFocus, setPaperFocus] = useState('Both Papers')
  const [isLoading, setIsLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Not authenticated")
      return
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        exam_date: examDate,
        daily_study_hours: dailyHours,
        paper_focus: paperFocus
      })
      .eq('id', user.id)

    setIsLoading(false)

    if (error) {
      toast.error('Failed to save profile. Please try again.')
    } else {
      setStep(2)
    }
  }

  const handleStartDiagnostic = () => {
    router.push('/diagnostic')
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto h-full min-h-[calc(100vh-4rem)]">
      <Toaster position="top-center" richColors />
      
      {step === 1 && (
        <div className="w-full bg-white p-8 rounded-2xl card-shadow border border-slate-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">1/2</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome! Let&apos;s set up your study plan</h1>
            <p className="text-slate-600">Personalizing your experience will help us build the perfect schedule.</p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">When is your FCPS Part 1 Exam?</label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Daily Study Hours: <span className="text-blue-600 font-bold">{dailyHours} hours</span>
              </label>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseInt(e.target.value))}
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>1h</span>
                <span>4h</span>
                <span>8h</span>
                <span>12h</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Paper Focus</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['Both Papers', 'Paper 1 Only', 'Paper 2 Only'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPaperFocus(opt)}
                    className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      paperFocus === opt 
                      ? 'border-blue-600 bg-blue-50 text-blue-700' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center mt-6"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
          </form>
        </div>
      )}

      {step === 2 && (
        <div className="w-full bg-white p-8 rounded-2xl card-shadow border border-slate-100 text-center text-center items-center flex flex-col">
          <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Diagnostic Quiz</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-md">
            We&apos;ll ask you 35 quick questions across all subjects to find your weak areas. This allows us to generate a highly personalized study schedule.
          </p>
          <div className="bg-orange-50 text-orange-800 p-4 rounded-lg mb-8 text-sm max-w-md text-left text-sm font-medium">
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              60 seconds per question
            </p>
          </div>
          
          <button 
            onClick={handleStartDiagnostic}
            className="w-full max-w-sm bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
          >
            Start Diagnostic
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
