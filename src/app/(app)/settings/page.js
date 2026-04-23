'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toaster, toast } from 'sonner'
import { 
  User, 
  Bell, 
  Shield, 
  LogOut, 
  Loader2, 
  Save, 
  Terminal, 
  Sparkles, 
  ChevronRight,
  Activity,
  Zap,
  Lock,
  Trash2,
  RefreshCw,
  Info,
  Calendar
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { clearUserProgress, syncDatabase } from '@/app/actions/dev-actions'
import { motion, AnimatePresence } from 'framer-motion'

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
  }, [supabase])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', user.id)
      
    if (error) {
      toast.error('Failed to update neural profile')
    } else {
      try {
        await supabase
          .from('ai_cache')
          .delete()
          .ilike('cache_key', `%_${user.id}%`)
        
        toast.success('Neural mapping updated! Re-syncing nexus...')
      } catch (cacheErr) {
        toast.success('Profile saved successfully')
      }
    }
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#05070A] flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
      <div className="relative flex flex-col items-center">
        <Activity className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
        <p className="text-white/40 font-medium tracking-widest uppercase text-xs">Accessing Neural Settings...</p>
      </div>
    </div>
  )

  const tabs = [
    { id: 'profile', label: 'Neural Profile', icon: User, color: 'blue' },
    { id: 'notifications', label: 'Pulse Alerts', icon: Bell, color: 'orange' },
    { id: 'security', label: 'Encryption', icon: Shield, color: 'emerald' },
    { id: 'dev', label: 'Nexus Control', icon: Terminal, color: 'purple' },
  ]

  return (
    <div className="min-h-screen bg-[#05070A] p-6 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-12">
      <Toaster position="top-center" richColors theme="dark" />
      
      {/* Background Ambient Effects */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Sidebar Nav */}
      <aside className="w-full md:w-80 shrink-0 relative z-20">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">System Config</h1>
          <p className="text-white/30 text-sm font-medium tracking-tight">Adjust your clinical simulation parameters.</p>
        </div>
        
        <nav className="space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-6 py-5 rounded-[2rem] border transition-all relative overflow-hidden group ${
                activeTab === tab.id 
                  ? 'bg-white/10 border-white/10 text-white shadow-xl shadow-black/20' 
                  : 'bg-white/5 border-transparent text-white/40 hover:bg-white/[0.08] hover:border-white/5 hover:text-white/60'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-400' : 'text-white/20'}`} />
                <span className="font-bold text-sm uppercase tracking-widest">{tab.label}</span>
              </div>
              {activeTab === tab.id && (
                <motion.div layoutId="activeTabGlow" className="absolute left-0 w-1 h-8 bg-blue-500 rounded-full" />
              )}
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === tab.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-40'}`} />
            </button>
          ))}
        </nav>
        
        <div className="mt-12 pt-8 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-8 py-5 rounded-[2rem] bg-red-500/5 text-red-400/60 hover:bg-red-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest border border-red-500/10 hover:border-red-500"
          >
            <LogOut className="w-5 h-5" /> Terminate Session
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full"
          >
            {activeTab === 'profile' && (
              <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border border-white/10 relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-12 pointer-events-none">
                  <User className="w-32 h-32 text-white/[0.02] group-hover:text-blue-500/[0.05] transition-colors duration-700" />
                </div>
                
                <div className="relative z-10">
                  <div className="mb-12">
                    <h2 className="text-3xl font-black text-white mb-2">Neural Profile</h2>
                    <p className="text-white/40 text-sm font-medium">Define your target clinical trajectory.</p>
                  </div>
                  
                  <form onSubmit={handleSave} className="space-y-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Clinical Designation (Full Name)</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Neural Name"
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold text-lg"
                        value={profile.full_name}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Target Horizon (Exam Date)</label>
                        <div className="relative group">
                          <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            type="date"
                            required
                            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold"
                            value={profile.exam_date}
                            onChange={(e) => setProfile({...profile, exam_date: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Processing Load (Daily Hours)</label>
                        <div className="relative group">
                          <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                          <select
                            className="w-full pl-16 pr-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all font-bold appearance-none cursor-pointer"
                            value={profile.daily_study_hours}
                            onChange={(e) => setProfile({...profile, daily_study_hours: parseInt(e.target.value)})}
                          >
                            {[1,2,3,4,5,6,7,8,9,10,12].map(num => (
                              <option key={num} value={num} className="bg-[#0F172A]">{num} Hours / Cycle</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Domain Focus Area</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['Both Papers', 'Paper 1 Only', 'Paper 2 Only'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setProfile({...profile, paper_focus: opt})}
                            className={`px-6 py-5 rounded-2xl border font-bold transition-all ${
                              profile.paper_focus === opt 
                              ? 'border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/10' 
                              : 'border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pt-8 border-t border-white/5 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="group relative overflow-hidden bg-white text-black px-12 py-5 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-3">
                          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                          Commit Changes
                        </span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border border-white/10 relative overflow-hidden group shadow-2xl">
                 <div className="mb-12">
                   <h2 className="text-3xl font-black text-white mb-2">Pulse Alerts</h2>
                   <p className="text-white/40 text-sm font-medium">Configure real-time neural synchronization.</p>
                 </div>
                 <div className="space-y-6">
                    <NotificationToggle title="Daily Sync Reminder" description="Neural push to maintain consistent study rhythms." checked={true} />
                    <NotificationToggle title="Competitive Flux" description="Alerts when peer ranking vectors shift." checked={true} />
                    <NotificationToggle title="SM-2 Readiness" description="Notification when critical recall nodes require refresh." checked={false} />
                 </div>
                 <div className="mt-12 pt-12 border-t border-white/5 flex justify-end">
                   <button className="px-10 py-5 bg-white/5 border border-white/5 rounded-2xl text-white/40 text-xs font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                     Update Signal Preferences
                   </button>
                 </div>
              </div>
            )}
            
            {activeTab === 'dev' && (
              <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border border-white/10 relative overflow-hidden group shadow-2xl bg-[#080B10]">
                 <div className="mb-12 flex items-center justify-between">
                   <div>
                     <h2 className="text-3xl font-black text-white mb-2">Nexus Control</h2>
                     <p className="text-white/40 text-sm font-medium tracking-tight font-mono">System level data integrity protocols.</p>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                     <Terminal className="w-6 h-6 text-purple-400" />
                   </div>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="p-8 border border-white/5 bg-white/[0.02] rounded-[2.5rem] relative overflow-hidden group">
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <h4 className="font-black text-white text-lg mb-2 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-purple-400 group-hover:rotate-180 transition-transform duration-700" /> 
                            Sync Global Index
                          </h4>
                          <p className="text-sm text-white/30 max-w-md font-medium">Re-align local neural mapping with verified central MCQ repository.</p>
                        </div>
                        <button 
                          onClick={async () => {
                            const res = await syncDatabase()
                            if (res.info) toast.info(res.info)
                          }}
                          className="px-8 py-4 bg-purple-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
                        >
                          Synchronize
                        </button>
                      </div>
                    </div>

                    <div className="p-8 border border-red-500/10 bg-red-500/[0.02] rounded-[2.5rem] relative overflow-hidden group">
                      <div className="flex items-center justify-between relative z-10">
                        <div>
                          <h4 className="font-black text-red-400 text-lg mb-2 flex items-center gap-2">
                            <Trash2 className="w-5 h-5" /> Wipe Progress Vectors
                          </h4>
                          <p className="text-sm text-red-400/40 max-w-md font-medium">Irreversible reset of all attempts, sessions, and recall patterns.</p>
                        </div>
                        <button 
                          onClick={async () => {
                            if (confirm('Are you ABSOLUTELY sure? This protocol cannot be reversed.')) {
                              const res = await clearUserProgress()
                              if (res.success) toast.success('Neural slate cleared.')
                              else toast.error('Protocol failed.')
                            }
                          }}
                          className="px-8 py-4 bg-transparent text-red-500 border border-red-500/20 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                          Execute Wipe
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="glass-card rounded-[3.5rem] p-10 md:p-16 border border-white/10 relative overflow-hidden group shadow-2xl">
                 <div className="mb-12">
                   <h2 className="text-3xl font-black text-white mb-2">Encryption</h2>
                   <p className="text-white/40 text-sm font-medium">Manage your access keys and security layers.</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">New Security Key</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Verify Key</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-bold"
                      />
                    </div>
                    
                    <div className="pt-8 border-t border-white/5 flex justify-end">
                      <button className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20">
                        Update Keys
                      </button>
                    </div>
                 </div>
                 
                 <div className="mt-16 p-8 border border-red-500/10 bg-red-500/[0.05] rounded-[2.5rem]">
                   <h4 className="font-black text-red-400 mb-2 flex items-center gap-2 uppercase tracking-widest text-xs"><Lock className="w-4 h-4" /> Final Lockdown</h4>
                   <p className="text-sm text-red-400/60 mb-8 font-medium">Self-destruct entire neural profile and associated clinical data.</p>
                   <button className="px-8 py-4 bg-white/5 text-red-400 border border-red-500/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                     Destroy Account
                   </button>
                 </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function NotificationToggle({ title, description, checked }) {
  const [isOn, setIsOn] = useState(checked)
  return (
    <div className="flex items-center justify-between p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group">
      <div>
        <h4 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{title}</h4>
        <p className="text-sm text-white/30 font-medium">{description}</p>
      </div>
      <button 
        onClick={() => setIsOn(!isOn)}
        className={`w-16 h-8 rounded-full transition-all relative ${isOn ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`}
      >
        <motion.div 
          animate={{ x: isOn ? 36 : 4 }}
          className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-xl"
        />
      </button>
    </div>
  )
}
