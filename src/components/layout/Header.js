'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User, Bell, Search, Settings, ShieldCheck, ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export default function Header() {
  const [profile, setProfile] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name, role, avatar_url')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      }
    }
    loadProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-50">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-lg group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-all duration-300" />
          <input
            type="text"
            placeholder="Search clinical archives..."
            className="w-full bg-slate-50 border-none rounded-[1.5rem] py-4 pl-12 pr-6 text-sm focus:ring-[12px] focus:ring-primary/5 transition-all placeholder:text-slate-400 font-medium text-slate-900 shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center space-x-8">
        <div className="hidden lg:flex items-center gap-3 bg-slate-900 px-6 py-3 rounded-[1.5rem] shadow-xl shadow-slate-200">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">System Active</span>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-4 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-2xl transition-all relative group tap-shrink">
            <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full border-2 border-white shadow-sm" />
          </button>
          
          <div className="h-10 w-px bg-slate-100" />

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-4 p-2 pr-6 rounded-[2rem] hover:bg-slate-50 transition-all group"
            >
              <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-display font-black text-lg shadow-xl shadow-slate-200 transition-transform group-hover:scale-105">
                {profile?.full_name?.charAt(0) || <User className="w-6 h-6" />}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-tight flex items-center gap-2">
                  {profile?.full_name || 'Dr. Practitioner'}
                  <ChevronDown className={clsx("w-3 h-3 transition-transform duration-300", isMenuOpen ? "rotate-180" : "")} />
                </p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Clinical Candidate</p>
              </div>
            </button>

            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)}
                />
                
                <div className="absolute right-0 mt-6 w-64 bg-white/90 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-100 py-6 z-50 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                  <div className="px-8 pb-4 mb-4 border-b border-slate-50">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated As</p>
                    <p className="text-sm font-black text-slate-900 truncate">{profile?.full_name || 'Dr. Practitioner'}</p>
                  </div>
                  
                  <div className="px-4 space-y-1">
                    {profile?.role === 'admin' && (
                      <Link 
                        href="/admin"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-4 px-6 py-3.5 text-sm text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 rounded-[1.25rem] transition-all"
                      >
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Admin Protocol
                      </Link>
                    )}
                    
                    <Link 
                      href="/settings"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 px-6 py-3.5 text-sm text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 rounded-[1.25rem] transition-all"
                    >
                      <Settings className="w-4 h-4 text-slate-300" />
                      System Config
                    </Link>
                    
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-4 px-6 py-3.5 text-sm text-rose-500 font-black hover:bg-rose-50 rounded-[1.25rem] transition-all w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      TERMINATE SESSION
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
