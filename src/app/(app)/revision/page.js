'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BrainCircuit, PlayCircle, Clock, ArrowRight, Zap, Target } from 'lucide-react'

export default function RevisionPage() {
  const [dueItems, setDueItems] = useState([])
  const [retentionRate, setRetentionRate] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRevision()
  }, [])

  async function loadRevision() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // Due items
    const { data: due } = await supabase
      .from('revision_queue')
      .select('*, topics(name, subject_id, subjects(name, color_hex))')
      .eq('user_id', user.id)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true })

    setDueItems(due || [])

    // All items for retention rate
    const { data: all } = await supabase
      .from('revision_queue')
      .select('ease_factor')
      .eq('user_id', user.id)

    setTotalItems(all?.length || 0)

    if (all && all.length > 0) {
      const avgEase = all.reduce((s, r) => s + Number(r.ease_factor), 0) / all.length
      const rate = Math.min(98, Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 60 + 40))
      setRetentionRate(rate)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl border border-slate-100 card-shadow">
        <h1 className="text-3xl font-bold text-slate-900 mb-1 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-purple-600" /> Spaced Repetition
        </h1>
        <p className="text-slate-500">Review topics at scientifically optimized intervals using the SM-2 algorithm.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6 text-center">
          <div className="text-4xl font-black text-purple-600 mb-1">{dueItems.length}</div>
          <p className="text-sm font-medium text-slate-500">Due Today</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6 text-center">
          <div className="text-4xl font-black text-blue-600 mb-1">{totalItems}</div>
          <p className="text-sm font-medium text-slate-500">Total Items</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6 text-center">
          <div className="text-4xl font-black text-teal-600 mb-1">{retentionRate}%</div>
          <p className="text-sm font-medium text-slate-500">Retention Rate</p>
        </div>
      </div>

      {/* Due Items List */}
      {dueItems.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Due for Review</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {dueItems.map(item => {
              const daysSinceLast = item.last_reviewed_at 
                ? Math.floor((Date.now() - new Date(item.last_reviewed_at).getTime()) / (1000*60*60*24))
                : null

              return (
                <div key={item.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: item.topics?.subjects?.color_hex || '#8B5CF6' }}></div>
                    <div>
                      <p className="font-bold text-slate-800">{item.topics?.name}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{item.topics?.subjects?.name}</span>
                        {item.last_accuracy !== null && (
                          <span className={`font-bold ${Number(item.last_accuracy) >= 70 ? 'text-teal-600' : 'text-orange-600'}`}>
                            Last: {item.last_accuracy}%
                          </span>
                        )}
                        {daysSinceLast !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {daysSinceLast}d ago
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" /> EF: {Number(item.ease_factor).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link 
                    href={`/quiz?topic=${item.topic_id}`}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" /> Review
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      ) : totalItems > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-12 text-center">
          <Target className="w-16 h-16 text-teal-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">All Caught Up! 🎉</h2>
          <p className="text-slate-500 max-w-md mx-auto">No topics are due for review right now. Keep practicing to build your revision queue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-12 text-center">
          <BrainCircuit className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Revisions Yet</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-6">Start taking quizzes to automatically build your spaced repetition queue.</p>
          <Link href="/subjects" className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors inline-flex items-center gap-2">
            Start Studying <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
