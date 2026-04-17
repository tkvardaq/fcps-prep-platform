'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, PlayCircle, BookOpen, ChevronDown, ChevronRight, Sparkles, Brain, Trophy, Target, Flame, GraduationCap } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const TOPIC_QUOTES = [
  "One topic down, legend status loading... ⚡",
  "Your brain cells just high-fived each other 🧠",
  "FCPS examiners are getting nervous 😤",
  "That's one less topic standing between you and 'Fellow' 🏆",
  "Consistency beats intensity. Keep going! 🔥",
]

import React from 'react'

export default function SubjectDetailPage({ params }) {
  const { id: subjectId } = React.use(params)
  const [subject, setSubject] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedTopic, setExpandedTopic] = useState(null)
  const [topicMcqCounts, setTopicMcqCounts] = useState({})
  const [groupedTopics, setGroupedTopics] = useState({})
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single()
        
      if (subjectData) {
        setSubject(subjectData)
        
        const { data: topicsData } = await supabase
          .from('topics')
          .select('*')
          .eq('subject_id', subjectData.id)
          .order('sort_order', { ascending: true })
          
        if (topicsData) {
          setTopics(topicsData)

          // Group topics by category
          const grouped = topicsData.reduce((acc, topic) => {
            const cat = topic.category || 'General'
            if (!acc[cat]) acc[cat] = []
            acc[cat].push(topic)
            return acc
          }, {})
          setGroupedTopics(grouped)

          // Get MCQ counts per topic
          const { data: mcqs } = await supabase
            .from('mcqs')
            .select('topic_id')
            .eq('subject_id', subjectData.id)

          if (mcqs) {
            const counts = {}
            mcqs.forEach(m => {
              if (m.topic_id) counts[m.topic_id] = (counts[m.topic_id] || 0) + 1
            })
            setTopicMcqCounts(counts)
          }
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [subjectId])

  if (loading) {
     return (
        <div className="flex justify-center items-center h-[60vh]">
           <div className="relative">
             <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200 border-t-blue-600"></div>
             <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 animate-pulse" />
           </div>
        </div>
     )
  }

  if (!subject) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Subject not found</h2>
        <button onClick={() => router.push('/subjects')} className="text-blue-600 mt-4 underline">Back to Subjects</button>
      </div>
    )
  }

  const hex = subject.color_hex || '#3B82F6'
  const totalMcqs = Object.values(topicMcqCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10"
        style={{ background: `linear-gradient(135deg, ${hex}12, ${hex}08)` }}
      >
        {/* Decorative sparks */}
        <div className="absolute top-4 right-6 opacity-30">
          <Sparkles className="w-6 h-6 animate-pulse" style={{ color: hex }} />
        </div>
        <div className="absolute bottom-6 right-20 opacity-20">
          <Sparkles className="w-4 h-4 animate-pulse" style={{ color: hex, animationDelay: '0.5s' }} />
        </div>

        <Link href="/subjects" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Subjects
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: `${hex}20`, color: hex }}>
                Paper {subject.paper_number}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500">
                {topics.length} Topics
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{subject.name}</h1>
            <p className="text-slate-500 max-w-xl text-base">{subject.description}</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => router.push(`/quiz?subject=${subject.id}`)} 
              className="px-6 py-3 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
              style={{ backgroundColor: hex, boxShadow: `0 8px 24px ${hex}30` }}
            >
              <PlayCircle className="w-5 h-5 mr-2" /> Quick Quiz
            </button>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex flex-wrap gap-3 mt-6">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-100">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-slate-700 text-sm font-bold">{totalMcqs} MCQs Available</span>
          </div>
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-2 border border-slate-100">
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-700 text-sm font-bold">{topics.length} Syllabus Topics</span>
          </div>
        </div>
      </motion.div>

      {/* Motivational Quote Banner */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4 text-amber-600" />
        </div>
        <p className="text-amber-800 text-sm font-medium italic">
          {TOPIC_QUOTES[Math.floor(Math.random() * TOPIC_QUOTES.length)]}
        </p>
      </motion.div>

      {/* Topics Accordion List */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 px-1 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-400" />
          Syllabus Topics
        </h2>
        
        <div className="space-y-10">
          {Object.entries(groupedTopics).map(([category, catTopics], catIdx) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="h-6 w-1 rounded-full" style={{ backgroundColor: hex }} />
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">{category}</h3>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                  {catTopics.length} Topics
                </span>
              </div>
              
              <div className="space-y-2">
                {catTopics.map((topic, idx) => {
                  const isExpanded = expandedTopic === topic.id
                  const mcqCount = topicMcqCounts[topic.id] || 0
                  
                  return (
                    <motion.div 
                      key={topic.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (catIdx * 0.1) + (idx * 0.04) }}
                      className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:border-slate-200 transition-all card-shadow-sm"
                    >
                      {/* Accordion Header */}
                      <button 
                        onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        className="w-full p-4 md:p-6 flex items-center gap-4 text-left group"
                      >
                        <div className="w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${hex}12`, color: hex }}>
                          {idx + 1}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{topic.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{topic.description}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {mcqCount > 0 && (
                            <span className="hidden md:flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                              <Brain className="w-3 h-3" /> {mcqCount}
                            </span>
                          )}
                          <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                            isExpanded ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"
                          )}>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </button>

                      {/* Accordion Body */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "circOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 md:px-6 pb-6 pt-2">
                              <div className="bg-slate-50/50 rounded-[1.5rem] p-6 border border-slate-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                      <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-rose-500 scale-90"><Target className="w-4 h-4" /></div>
                                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-500 scale-90"><Brain className="w-4 h-4" /></div>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Topic Ready for Study</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-medium">Practice {mcqCount} industry-standard MCQs or review high-yield notes.</p>
                                </div>

                                <div className="flex items-center gap-3 w-full md:w-auto">
                                  <Link 
                                    href={`/study/${topic.id}`} 
                                    className="flex-1 md:flex-none px-6 py-3 text-sm font-black rounded-2xl transition-all flex items-center justify-center bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
                                  >
                                    <BookOpen className="w-4 h-4 mr-2" /> Study Notes
                                  </Link>
                                  
                                  {mcqCount > 50 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {[...Array(Math.min(5, Math.ceil(mcqCount / 50)))].map((_, i) => (
                                        <Link 
                                          key={i}
                                          href={`/quiz?topic=${topic.id}&set=${i + 1}`} 
                                          className="px-4 py-2 text-[10px] font-black rounded-xl transition-all flex items-center justify-center text-white soft-glow-pink"
                                          style={{ backgroundColor: hex }}
                                        >
                                          Set {i + 1}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : (
                                    <Link 
                                      href={`/quiz?topic=${topic.id}`} 
                                      className="flex-1 md:flex-none px-6 py-3 text-sm font-black rounded-2xl transition-all flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                                      style={{ backgroundColor: hex, boxShadow: `0 8px 20px ${hex}30` }}
                                    >
                                      <PlayCircle className="w-4 h-4 mr-2" /> Practice
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {topics.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No topics have been added for this subject yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
