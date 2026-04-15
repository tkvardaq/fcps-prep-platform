export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Left side: branding/image */}
      <div className="hidden md:flex flex-col justify-center items-center bg-blue-900 text-white p-12">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-4 font-sans tracking-tight">FCPS Prep</h1>
          <p className="text-xl text-blue-100 font-light mb-8">
            Pakistan's #1 FCPS Part 1 Gynae & Obs Prep Platform
          </p>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span>AI-Generated High-Yield MCQs</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span>Spaced Repetition & Weak Topic Detection</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span>Personalized Study Planners</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side: form */}
      <div className="flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900 tracking-tight">FCPS Prep</h1>
            <p className="text-slate-600 mt-2">Gynae & Obs Part 1</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
