'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User, Bell } from 'lucide-react'

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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="md:hidden">
        <span className="text-xl font-bold text-blue-900 tracking-tight">FCPS Prep</span>
      </div>
      <div className="hidden md:block" /> {/* Spacer for flex */}

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
              {profile?.full_name?.charAt(0) || <User className="w-5 h-5" />}
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
