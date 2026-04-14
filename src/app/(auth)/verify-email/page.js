import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="bg-white p-8 rounded-2xl card-shadow border border-slate-100 text-center">
      <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      </div>
      
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
      <p className="text-slate-600 mb-8">
        We've sent a verification link to your email address. Please click the link to activate your account.
      </p>
      
      <div className="space-y-4">
        <Link 
          href="/login"
          className="block w-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2.5 rounded-lg transition-colors"
        >
          Return to login
        </Link>
      </div>
    </div>
  )
}
