'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trophy, TrendingUp, Target, Award, Zap, Medal } from 'lucide-react'

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchLeaderboard() {
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch top 50 users based on score
      const { data, error } = await supabase
        .from('leaderboard_cache')
        .select('*, user_profiles(full_name, avatar_url, paper_focus)')
        .order('rank', { ascending: true })
        .limit(50)

      if (data) {
        setLeaders(data)
        
        // Find current user's rank
        const rank = data.findIndex(l => l.user_id === user?.id) + 1
        if (rank > 0) {
           setCurrentUserRank(rank)
        }
      }
      
      setLoading(false)
    }

    fetchLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 md:p-10 text-white card-shadow relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
           <Trophy className="w-48 h-48" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Global Ranking
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-sm flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> Season 1
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Wall of Fame</h1>
              <p className="text-amber-100/90 text-lg max-w-md">
                Compete with other FCPS aspirants. Climb the ranks by mastering topics and answering correctly.
              </p>
            </div>
            
            {currentUserRank && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[160px]">
                <p className="text-amber-100 text-sm font-bold uppercase tracking-wider mb-1">Your Rank</p>
                <div className="text-5xl font-black">#{currentUserRank}</div>
              </div>
            )}
         </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-100 card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 w-24 text-center">Rank</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400">Physician</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell text-center">Focus</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">MCQs</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 hidden md:table-cell text-right">Accuracy</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-slate-400 text-right pr-8">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leaders.map((leader, index) => {
                const isTop3 = index < 3;
                return (
                  <tr key={leader.user_id} className={`transition-colors hover:bg-slate-50/50 ${currentUserRank === index + 1 ? 'bg-blue-50/50' : ''}`}>
                    <td className="py-5 px-6 text-center">
                      {index === 0 ? <Medal className="w-8 h-8 text-yellow-500 mx-auto" /> :
                       index === 1 ? <Medal className="w-8 h-8 text-slate-400 mx-auto" /> :
                       index === 2 ? <Medal className="w-8 h-8 text-amber-700 mx-auto" /> :
                       <span className="font-bold text-slate-400 mx-auto block text-lg">#{index + 1}</span>}
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className={`font-bold ${isTop3 ? 'text-slate-900 text-lg' : 'text-slate-800'}`}>
                          Dr. {leader.user_profiles?.full_name?.split(' ')[0] || 'Unknown'}
                        </span>
                        <span className="text-xs text-slate-400 hidden sm:block">Joined recently</span>
                      </div>
                    </td>
                    <td className="py-5 px-6 hidden md:table-cell text-center">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        {leader.user_profiles?.paper_focus || 'Both'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex items-center justify-end font-bold text-slate-900 gap-1.5">
                        <Target className="w-4 h-4 text-amber-500 hidden sm:block" />
                        {leader.total_mcqs_attempted?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="py-5 px-6 hidden md:table-cell text-right font-medium text-slate-600">
                      {leader.overall_accuracy}%
                    </td>
                    <td className="py-5 px-6 text-right pr-8">
                      <div className="flex items-center justify-end font-bold text-slate-900 gap-1">
                        <Zap className={`w-4 h-4 ${leader.current_streak > 0 ? 'text-orange-500 fill-orange-500/20' : 'text-slate-300'}`} />
                        {leader.current_streak}d
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {leaders.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p>No leaderboard data available yet. Start practicing to be the first!</p>
          </div>
        )}
      </div>
    </div>
  )
}
