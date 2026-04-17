'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'sonner'
import { User, Bell, Shield, LogOut, Loader2, Save, Terminal, Sparkles } from 'lucide-react'
import { seedInitialMCQs } from '@/app/actions/seed-actions'
import { useRouter } from 'next/navigation'
import { clearUserProgress, syncDatabase } from '@/app/actions/dev-actions'


export default function SettingsPage() {
  const [profile, setProfile] = useState({
    full_name: '',
    daily_study_hours: 4,
    paper_focus: 'Both Papers',
    exam_date: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            daily_study_hours: data.daily_study_hours || 4,
            paper_focus: data.paper_focus || 'Both Papers',
            exam_date: data.exam_date || ''
          })
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', user.id)
      
    if (error) {
      toast.error('Failed to update profile')
    } else {
      // Clear analytics and study plan cache to force refresh with new goals
      try {
        await supabase
          .from('ai_cache')
          .delete()
          .ilike('cache_key', `%_${user.id}%`)
        
        toast.success('Settings updated! Dashboard and Planner will re-sync.')
      } catch (cacheErr) {
        console.error('Cache clear error:', cacheErr)
        toast.success('Settings updated successfully')
      }
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600"></div></div>
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto h-full">
      <Toaster position="top-center" richColors />
      
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0">
          <h1 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Settings</h1>
          
          <nav className="space-y-1">
             <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
               <User className="w-5 h-5" /> Profile & Goals
             </button>
             <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
               <Bell className="w-5 h-5" /> Notifications
             </button>
             <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
               <Shield className="w-5 h-5" /> Account & Security
             </button>
             <button onClick={() => setActiveTab('dev')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'dev' ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:bg-slate-50'}`}>
               <Terminal className="w-5 h-5" /> Developer Tools
             </button>
          </nav>
          
          <div className="mt-8 pt-8 border-t border-slate-200">
             <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors">
               <LogOut className="w-5 h-5" /> Sign Out
             </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <div className="flex-1">
           {activeTab === 'profile' && (
             <div className="bg-white rounded-3xl p-8 card-shadow border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Profile & Study Goals</h2>
                
                <form onSubmit={handleSave} className="space-y-6">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Dr. Full Name</label>
                     <input
                       type="text"
                       required
                       className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50"
                       value={profile.full_name}
                       onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                     />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Target Exam Date</label>
                       <input
                         type="date"
                         required
                         className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50"
                         value={profile.exam_date}
                         onChange={(e) => setProfile({...profile, exam_date: e.target.value})}
                       />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Daily Study Hours</label>
                        <select
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50"
                          value={profile.daily_study_hours}
                          onChange={(e) => setProfile({...profile, daily_study_hours: parseInt(e.target.value)})}
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                            <option key={num} value={num}>{num} Hours / day</option>
                          ))}
                        </select>
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Paper Focus Area</label>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                       {['Both Papers', 'Paper 1 Only', 'Paper 2 Only'].map((opt) => (
                         <button
                           key={opt}
                           type="button"
                           onClick={() => setProfile({...profile, paper_focus: opt})}
                           className={`px-4 py-3 rounded-xl border font-medium transition-colors ${
                             profile.paper_focus === opt 
                             ? 'border-blue-600 bg-blue-50 text-blue-700' 
                             : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                           }`}
                         >
                           {opt}
                         </button>
                       ))}
                     </div>
                   </div>
                   
                   <div className="pt-4 border-t border-slate-100 flex justify-end">
                     <button
                       type="submit"
                       disabled={saving}
                       className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg"
                     >
                       {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                       Save Changes
                     </button>
                   </div>
                </form>
             </div>
           )}
           
           {activeTab === 'notifications' && (
             <div className="bg-white rounded-3xl p-8 card-shadow border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                     <div>
                       <h4 className="font-bold text-slate-800">Daily Study Reminders</h4>
                       <p className="text-sm text-slate-500">Push notifications to keep you on schedule</p>
                     </div>
                     <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                   </div>
                   <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                     <div>
                       <h4 className="font-bold text-slate-800">Leaderboard Alerts</h4>
                       <p className="text-sm text-slate-500">Get notified when someone passes your rank</p>
                     </div>
                     <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                  <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                    Update Preferences
                  </button>
                </div>
             </div>
           )}
           
           {activeTab === 'dev' && (
             <div className="bg-white rounded-3xl p-8 card-shadow border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Developer Tools</h2>
                <p className="text-slate-500 mb-8">System maintenance and data synchronization tools.</p>
                
                <div className="space-y-6">
                   <div className="p-6 border border-slate-100 bg-slate-50 rounded-2xl">
                     <div className="flex items-start justify-between">
                       <div>
                         <h4 className="font-bold text-slate-900">Sync MCQ Database</h4>
                         <p className="text-sm text-slate-500 mt-1">Re-align database with the latest verified MCQ dataset from CSV.</p>
                       </div>
                       <button 
                         onClick={async () => {
                           const res = await syncDatabase()
                           if (res.info) toast.info(res.info)
                         }}
                         className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                       >
                         <Sparkles className="w-4 h-4" /> Sync Now
                       </button>
                     </div>
                   </div>

                   <div className="p-6 border border-red-50 bg-red-50/30 rounded-2xl">
                     <div className="flex items-start justify-between">
                       <div>
                         <h4 className="font-bold text-red-900">Clear All Progress</h4>
                         <p className="text-sm text-red-700 mt-1">Reset all your attempts, sessions, weak areas, and bookmarks. This cannot be undone.</p>
                       </div>
                       <button 
                         onClick={async () => {
                           if (confirm('Are you ABSOLUTELY sure? All your progress will be permanently deleted.')) {
                             const res = await clearUserProgress()
                             if (res.success) {
                               toast.success('Your progress has been cleared.')
                             } else {
                               toast.error('Failed to clear progress')
                             }
                           }
                         }}
                         className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-50 transition-all"
                       >
                         Clear Everything
                       </button>
                     </div>
                   </div>
                </div>
             </div>
           )}
           
           {activeTab === 'security' && (
             <div className="bg-white rounded-3xl p-8 card-shadow border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Account & Security</h2>
                
                <div className="space-y-6">
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                     <input
                       type="password"
                       placeholder="••••••••"
                       className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                     <input
                       type="password"
                       placeholder="••••••••"
                       className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-slate-50"
                     />
                   </div>
                   
                   <div className="pt-4 border-t border-slate-100 flex justify-end">
                     <button className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-lg">
                       Change Password
                     </button>
                   </div>
                </div>
                
                <div className="mt-12 p-6 border border-red-100 bg-red-50 rounded-2xl">
                  <h4 className="font-bold text-red-900 mb-1">Danger Zone</h4>
                  <p className="text-sm text-red-700 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors">
                    Delete Account
                  </button>
                </div>
             </div>
           )}
        </div>
      </div>
      
    </div>
  )
}
