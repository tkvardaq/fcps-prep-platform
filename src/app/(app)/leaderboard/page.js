'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Target, 
  Award, 
  Zap, 
  Medal,
  Activity,
  User,
  ShieldCheck,
  Crown
} from 'lucide-react'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch top users from the leaderboard cache
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*, user_profiles(full_name, avatar_url, paper_focus)')
        .order('rank', { ascending: true })
        .limit(50)

      if (data) {
        setLeaders(data)
        const rank = data.findIndex(l => l.user_id === user?.id) + 1
        if (rank > 0) setCurrentUserRank(rank)
      }
      setLoading(false)
    }

    fetchLeaderboard()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-12">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity size={24} className="text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="font-display font-black text-slate-900 uppercase tracking-widest text-sm">Synoptic Engine</p>
            <p className="font-sans text-slate-400 text-xs font-medium tracking-tight">Recalibrating Global Rankings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFBFB] p-4 md:p-8 lg:p-12 pb-24">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full border border-primary/10">
              <Trophy size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Global Excellence</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-black tracking-tight leading-none text-slate-900">
              Clinical <br />
              <span className="text-primary">Vanguard</span>
            </h1>
            <p className="text-slate-500 font-sans font-medium text-lg leading-relaxed max-w-md">
              Elite rankings of the world&apos;s most dedicated medical practitioners.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-6 min-w-[280px]"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Award size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Your Standing</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-display font-black text-slate-900">
                  {currentUserRank ? `#${currentUserRank}` : 'Unranked'}
                </span>
                {currentUserRank && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center">
                    <ShieldCheck size={12} className="mr-0.5" /> Verified
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Leaderboard Table */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-[3.5rem] border border-white/80 shadow-2xl overflow-hidden bg-white/40 backdrop-blur-md"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white/30">
                  <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center w-24">Rank</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Practitioner</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Focus</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Activity</th>
                  <th className="py-8 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Efficiency</th>
                  <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Momentum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {leaders.map((leader, index) => {
                    const isTop3 = index < 3;
                    const isCurrentUser = currentUserRank === index + 1;
                    
                    return (
                      <motion.tr 
                        key={leader.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group transition-all hover:bg-white/80 ${isCurrentUser ? 'bg-primary/[0.03]' : ''}`}
                      >
                        <td className="py-6 px-8 text-center">
                          <div className="flex items-center justify-center relative">
                            {index === 0 ? (
                              <div className="relative">
                                <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                                <Medal className="w-10 h-10 text-amber-400 drop-shadow-[0_4px_8px_rgba(251,191,36,0.3)]" />
                              </div>
                            ) : index === 1 ? (
                              <Medal className="w-10 h-10 text-slate-300 drop-shadow-[0_4px_8px_rgba(203,213,225,0.3)]" />
                            ) : index === 2 ? (
                              <Medal className="w-10 h-10 text-amber-700/60 drop-shadow-[0_4px_8px_rgba(180,83,9,0.2)]" />
                            ) : (
                              <span className="font-display font-black text-slate-200 text-xl group-hover:text-slate-400 transition-colors">#{index + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-6 px-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:rounded-[1.25rem] group-hover:rotate-3 shadow-sm ${
                              isTop3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {leader.user_profiles?.avatar_url ? (
                                <img src={leader.user_profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={20} />
                              )}
                            </div>
                            <div>
                              <p className={`font-display font-black tracking-tight ${isTop3 ? 'text-lg text-slate-900' : 'text-slate-700'}`}>
                                Dr. {leader.user_profiles?.full_name?.split(' ')[0] || 'Aspirant'}
                              </p>
                              {isCurrentUser && (
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                                  <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                                  Active Profile
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                          <span className="inline-flex px-3 py-1 bg-white border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                            {leader.user_profiles?.paper_focus || 'Unified'}
                          </span>
                        </td>
                        <td className="py-6 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Target size={14} className="text-slate-300" />
                            <span className="font-display font-black text-slate-900">{leader.total_mcqs_attempted?.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`font-display font-black ${leader.overall_accuracy > 80 ? 'text-emerald-500' : 'text-slate-900'}`}>
                              {leader.overall_accuracy}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${leader.overall_accuracy}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${leader.overall_accuracy > 80 ? 'bg-emerald-400' : 'bg-primary'}`} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-xl border border-rose-100 group-hover:scale-105 transition-transform">
                            <Zap size={14} className="text-rose-500 fill-rose-500" />
                            <span className="font-display font-black text-rose-600">{leader.current_streak}d</span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {leaders.length === 0 && (
            <div className="py-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Activity size={32} className="text-slate-200" />
              </div>
              <h3 className="text-2xl font-display font-black text-slate-900 mb-2">No Active Vanguard</h3>
              <p className="text-slate-400 font-sans font-medium max-w-xs mx-auto">
                The global rankings are resetting. Be the first to claim your clinical dominance.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
