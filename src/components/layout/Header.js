'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User, Bell, Search } from 'lucide-react'

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
    <header className="h-20 bg-white/50 backdrop-blur-md border-b border-rose-100/50 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
          <input
            type="text"
            placeholder="Search study material... ✨"
            className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-rose-500/20 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden lg:flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100/50">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Goal: 4h Today ✨</span>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </button>
          
          <div className="h-8 w-px bg-rose-100/50" />

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-3 p-1.5 pr-4 rounded-2xl hover:bg-rose-50 group transition-all"
          >
            <div className="w-9 h-9 bg-gradient-to-tr from-rose-400 to-violet-400 rounded-xl flex items-center justify-center text-white soft-glow-pink group-hover:scale-105 transition-transform">
              {profile?.full_name?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{profile?.full_name || 'Dr. User'} ✨</p>
              <p className="text-[10px] text-slate-500 font-medium">FCPS Candidate</p>
            </div>
          </button>

          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsMenuOpen(false)}
              />
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">{profile?.full_name || 'Dr. User'}</p>
                </div>
                
                {profile?.role === 'admin' && (
                  <Link 
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                  >
                    Admin Dashboard
                  </Link>
                )}
                
                <Link 
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full text-left"
                >
                  Settings
                </Link>
                
                <button 
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
