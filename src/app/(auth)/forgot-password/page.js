'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Toaster, toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  
  const supabase = createClient()

  const handleReset = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      setIsSent(true)
    }
    
    setIsLoading(false)
  }

  if (isSent) {
    return (
      <div className="bg-white p-8 rounded-2xl card-shadow border border-slate-100 text-center">
        <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Sent</h2>
        <p className="text-slate-600 mb-8">
          Check your email for a password reset link.
        </p>
        <Link 
          href="/login"
          className="block w-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2.5 rounded-lg transition-colors"
        >
          Return to login
        </Link>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="bg-white p-8 rounded-2xl card-shadow border border-slate-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-slate-500 mt-1">Enter your email and we&apos;ll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="doctor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-medium py-2.5 rounded-lg transition-colors flex justify-center items-center mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to login
          </Link>
        </div>
      </div>
    </>
  )
}
