'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, 
  PlayCircle, 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Sparkles, 
  Brain, 
  Trophy, 
  Target, 
  Flame, 
  GraduationCap,
  Activity,
  ShieldCheck,
  Stethoscope,
  Microscope,
  ClipboardList
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import React from 'react'

const CLINICAL_INSIGHTS = [
  "Clinical correlation is paramount for high-yield mastery. 🧬",
  "Diagnostic precision depends on foundational physiological concepts. 🩺",
  "Systematic review leads to clinical excellence in Paper 1 and 2. 📋",
  "High-yield neural pathways are being reinforced. 🧠",
  "Protocol adherence ensures comprehensive syllabus coverage. ⚡",
]

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
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#FFFBFB]">
          <div className="relative">
            <div className="w-16 h-16 border-[4px] border-primary/10 border-t-primary rounded-2xl animate-[spin_1.5s_linear_infinite]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity size={24} className="text-primary animate-pulse" />
            </div>
          </div>
          <div className="mt-8 text-center space-y-1">
            <h2 className="text-sm font-display font-black text-slate-900 tracking-tight uppercase">Loading Diagnostic Module</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">Accessing Neural Database</p>
          </div>
        </div>
     )
  }

  if (!subject) {
    return (
      <div className="p-8 text-center bg-[#FFFBFB] min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Module Not Found</h2>
        <p className="text-slate-500 mt-2 font-medium">The requested subject identifier is invalid.</p>
        <button onClick={() => router.push('/subjects')} className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
          Return to Registry
        </button>
      </div>
    )
  }

  const hex = subject.color_hex || '#0EA5E9'
  const totalMcqs = Object.values(topicMcqCounts).reduce((a, b) => a + b, 0)

  return (
    <main className="min-h-screen bg-[#FFFBFB] p-4 md:p-8 lg:p-12 selection:bg-primary/10 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Immersive Clinical Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden glass-card p-10 md:p-14 rounded-[4rem] shadow-2xl border border-white group"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-900 -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-1000">
            <Microscope size={240} />
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -ml-32 -mb-32" />

          <Link href="/subjects" className="inline-flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-all mb-8 group/back">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover/back:-translate-x-1 transition-transform" /> 
            Protocol / Subjects / {subject.name}
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                  Paper {subject.paper_number}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Specialty Registry</span>
              </div>
              
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight leading-[1.1] mb-4">
                  {subject.name}
                </h1>
                <p className="text-slate-500 max-w-xl text-lg font-medium leading-relaxed">
                  {subject.description}
                </p>
              </div>

              {/* Neural Stats */}
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-5 py-3 border border-slate-100 shadow-sm text-surface">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Brain size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">MCQ Density</span>
                    <span className="text-sm font-black text-slate-900">{totalMcqs} Evaluated Tasks</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-5 py-3 border border-slate-100 shadow-sm text-surface">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                    <Target size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Syllabus Scope</span>
                    <span className="text-sm font-black text-slate-900">{topics.length} Core Domains</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="shrink-0">
              <button 
                onClick={() => router.push(`/quiz?subject=${subject.id}`)} 
                className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all shadow-2xl hover:bg-slate-800 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
              >
                <PlayCircle className="w-6 h-6" /> Initialize Assessment
              </button>
            </div>
          </div>
        </motion.div>

        {/* Clinical Insight Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 p-8 md:p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[60px] -mr-24 -mt-24" />
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Protocol Insight</h4>
              <p className="text-slate-300 text-sm font-medium italic leading-relaxed">
                "{CLINICAL_INSIGHTS[Math.floor(Math.random() * CLINICAL_INSIGHTS.length)]}"
              </p>
            </div>
          </div>
        </motion.div>

        {/* Syllabus Section */}
        <div className="space-y-10">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-display font-black text-slate-900 tracking-tight flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400">
                <ClipboardList size={20} />
              </div>
              Neural Domain Mapping
            </h2>
            <div className="h-px flex-1 bg-slate-100 mx-8 hidden md:block" />
            <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {topics.length} Total Nodes
            </div>
          </div>
          
          <div className="space-y-16">
            {Object.entries(groupedTopics).map(([category, catTopics], catIdx) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4 px-4">
                  <div className="w-1.5 h-6 rounded-full bg-slate-900" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{category}</h3>
                  <span className="text-[10px] font-bold text-slate-300 ml-auto">{catTopics.length} Units</span>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {catTopics.map((topic, idx) => {
                    const isExpanded = expandedTopic === topic.id
                    const mcqCount = topicMcqCounts[topic.id] || 0
                    
                    return (
                      <motion.div 
                        key={topic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (catIdx * 0.1) + (idx * 0.04) }}
                        className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5"
                      >
                        {/* Accordion Header */}
                        <button 
                          onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                          className="w-full p-6 md:p-8 flex items-center gap-6 text-left group"
                        >
                          <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center font-display font-black text-sm text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {(idx + 1).toString().padStart(2, '0')}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight">{topic.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-1">{topic.description || 'Clinical node awaiting systematic review'}</p>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            {mcqCount > 0 && (
                              <div className="hidden md:flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">MCQ Load</span>
                                <span className="text-xs font-black text-slate-900">{mcqCount} Tasks</span>
                              </div>
                            )}
                            <div className={clsx(
                              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
                              isExpanded ? "bg-slate-900 text-white shadow-lg" : "bg-slate-50 text-slate-300"
                            )}>
                              <ChevronDown className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
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
                              transition={{ duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 md:px-8 pb-8 pt-2">
                                <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100/50 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16" />
                                  
                                  <div className="space-y-4 relative z-10">
                                    <div className="flex items-center gap-4">
                                      <div className="flex -space-x-3">
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-primary"><Stethoscope size={18} /></div>
                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-500"><Brain size={18} /></div>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Operational Status</span>
                                        <span className="text-sm font-bold text-slate-900">Node Ready for Recalibration</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium max-w-md leading-relaxed">
                                      Execute systematic review of {mcqCount} validated clinical evaluators or access high-yield protocol documentation.
                                    </p>
                                  </div>

                                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto relative z-10">
                                    <Link 
                                      href={`/study/${topic.id}`} 
                                      className="w-full sm:w-auto px-8 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center bg-white text-slate-900 border border-slate-200 hover:border-slate-900 shadow-sm uppercase tracking-widest"
                                    >
                                      <BookOpen className="w-4 h-4 mr-2" /> Neural Notes
                                    </Link>
                                    
                                    <Link 
                                      href={`/quiz?topic=${topic.id}`} 
                                      className="w-full sm:w-auto px-8 py-4 text-[10px] font-black rounded-2xl transition-all flex items-center justify-center bg-slate-900 text-white shadow-xl hover:bg-slate-800 hover:-translate-y-1 active:scale-95 uppercase tracking-widest"
                                    >
                                      <PlayCircle className="w-4 h-4 mr-2" /> Start Protocol
                                    </Link>
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
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
                <GraduationCap size={40} />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Registry Depleted</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">No diagnostic nodes have been indexed for this clinical specialty.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
