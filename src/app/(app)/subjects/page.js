'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  BookOpen, 
  ChevronRight, 
  Search, 
  Sparkles, 
  Flame, 
  Trophy, 
  GraduationCap, 
  Brain, 
  Stethoscope, 
  FlaskConical, 
  Pill, 
  Bug, 
  Microscope, 
  HeartPulse, 
  BarChart3, 
  Heart, 
  Baby, 
  Bone, 
  Beaker,
  Activity,
  Target,
  ShieldCheck,
  ClipboardList
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const CLINICAL_INSIGHTS = [
  { text: "Precision in foundational concepts dictates clinical outcomes.", author: "Diagnostic Protocol" },
  { text: "Systematic review of pathology reveals the underlying physiological truth.", author: "Clinical Methodology" },
  { text: "High-yield mastery is built through consistent neural recalibration.", author: "Board Review Strategy" },
  { text: "A physician's capability is directly proportional to their baseline knowledge.", author: "Medical Registry" },
  { text: "Protocol adherence and systematic study ensure assessment success.", author: "Fellowship Standards" },
]

const ICON_MAP = {
  'Bone': Bone, 'HeartPulse': HeartPulse, 'Dna': FlaskConical, 'Pill': Pill,
  'Microscope': Microscope, 'Bug': Bug, 'Baby': Baby, 'BarChart3': BarChart3,
  'Heart': Heart, 'Stethoscope': Stethoscope, 'Beaker': Beaker,
  'UserRoundCheck': GraduationCap, 'Activity': HeartPulse,
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [progressMap, setProgressMap] = useState({})
  const [mcqCountMap, setMcqCountMap] = useState({})
  const [activeTab, setActiveTab] = useState(1)
  const [insight, setInsight] = useState(CLINICAL_INSIGHTS[0])
  
  const supabase = createClient()

  useEffect(() => {
    const timer = setTimeout(() => {
      setInsight(CLINICAL_INSIGHTS[Math.floor(Math.random() * CLINICAL_INSIGHTS.length)])
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    async function loadSubjects() {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*, topics(count)')
        .order('sort_order', { ascending: true })
        
      if (!error && data) {
        setSubjects(data)
      }

      // Load MCQ counts per subject using proper count queries
      if (data) {
        const counts = {}
        await Promise.all(data.map(async (subj) => {
          const { count } = await supabase
            .from('mcqs')
            .select('id', { count: 'exact', head: true })
            .eq('subject_id', subj.id)
            .eq('is_published', true)
          counts[subj.id] = count || 0
        }))
        setMcqCountMap(counts)
      }

      if (user) {
        const { data: attempts } = await supabase
          .from('user_attempts')
          .select('subject_id, is_correct')
          .eq('user_id', user.id)

        if (attempts) {
          const map = {}
          attempts.forEach(a => {
            if (!map[a.subject_id]) map[a.subject_id] = { total: 0, correct: 0 }
            map[a.subject_id].total++
            if (a.is_correct) map[a.subject_id].correct++
          })
          
          const progMap = {}
          Object.entries(map).forEach(([sid, v]) => {
            progMap[sid] = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0
          })
          setProgressMap(progMap)
        }
      }

      setLoading(false)
    }
    
    loadSubjects()
  }, [supabase])

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
            <h2 className="text-sm font-display font-black text-slate-900 tracking-tight uppercase">Loading Clinical Registry</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Diagnostic Modules</p>
          </div>
        </div>
     )
  }

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const paper1 = filteredSubjects.filter(s => s.paper_number === 1)
  const paper2 = filteredSubjects.filter(s => s.paper_number === 2)
  const activeSubjects = activeTab === 1 ? paper1 : paper2

  const totalMCQs = Object.values(mcqCountMap).reduce((a, b) => a + b, 0)

  return (
    <main className="min-h-screen bg-[#FFFBFB] p-4 md:p-8 lg:p-12 selection:bg-primary/10 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Immersive Clinical Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-slate-900 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl group"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] text-white -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-1000">
            <ClipboardList size={240} />
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -ml-32 -mb-32" />

          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-md shadow-xl">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-[10px] font-black tracking-[0.3em] uppercase text-primary">Assessment Registry</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">FCPS Part I Protocol</p>
                </div>
              </div>
              
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight mb-4">
                  Syllabus Mastery Registry
                </h1>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 relative group/insight">
                  <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-primary animate-pulse" />
                  <p className="text-slate-300 text-sm italic leading-relaxed">&quot;{insight.text}&quot;</p>
                  <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-3">— {insight.author}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] min-w-[140px] text-center space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Units</p>
                <p className="text-3xl font-display font-black text-white">{subjects.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] min-w-[140px] text-center space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MCQ Density</p>
                <p className="text-3xl font-display font-black text-primary">{totalMCQs.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2.5rem] min-w-[140px] text-center space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Papers</p>
                <p className="text-3xl font-display font-black text-white">02</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Navigation Control */}
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
          {/* Tabs */}
          <div className="flex bg-slate-100/50 backdrop-blur-sm rounded-[2rem] p-2 gap-2 border border-slate-100">
            <button 
              onClick={() => setActiveTab(1)}
              className={clsx(
                "px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest flex items-center gap-3",
                activeTab === 1 ? "bg-white text-slate-900 shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black", activeTab === 1 ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-400")}>P1</div>
              General Core
            </button>
            <button 
              onClick={() => setActiveTab(2)}
              className={clsx(
                "px-8 py-3 rounded-[1.5rem] text-xs font-black transition-all uppercase tracking-widest flex items-center gap-3",
                activeTab === 2 ? "bg-white text-slate-900 shadow-xl shadow-slate-200" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black", activeTab === 2 ? "bg-secondary/10 text-secondary" : "bg-slate-200 text-slate-400")}>P2</div>
              Specialty Mastery
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full lg:max-w-md group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-8 py-5 border-none rounded-[2rem] text-sm bg-white placeholder-slate-300 focus:outline-none focus:ring-[12px] focus:ring-primary/5 transition-all shadow-inner font-bold text-slate-900"
              placeholder="Search diagnostic module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Subject Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {activeSubjects.map((subject, idx) => (
              <SubjectCard 
                key={subject.id} 
                subject={subject} 
                progress={progressMap[subject.id] || 0} 
                mcqCount={mcqCountMap[subject.id] || 0}
                index={idx}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {activeSubjects.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-6 border border-slate-100 shadow-inner">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-display font-black text-slate-900 tracking-tight uppercase">Registry Entry Not Found</h3>
            <p className="text-slate-400 mt-2 font-medium">No diagnostic modules match your current query.</p>
          </div>
        )}
      </div>
    </main>
  )
}

function SubjectCard({ subject, progress, mcqCount, index }) {
  const hex = subject.color_hex || '#0EA5E9'
  const IconComponent = ICON_MAP[subject.icon_name] || BookOpen
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/subjects/${subject.id}`} className="block group">
        <div className="relative bg-white rounded-[3rem] overflow-hidden border border-slate-100 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-20px_rgba(14,165,233,0.15)] h-full flex flex-col p-8">
          
          {/* Header Stats */}
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${hex}10` }}>
              <IconComponent className="w-7 h-7" style={{ color: hex }} />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Paper {subject.paper_number}</span>
              <div className={clsx(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                progress >= 70 ? "bg-emerald-50 text-emerald-600" : "bg-primary/5 text-primary"
              )}>
                {progress}% Mastery
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col">
            <h3 className="text-xl font-display font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight mb-2 leading-tight">
              {subject.name}
            </h3>
            <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-8">{subject.description}</p>
            
            {/* Meta Row */}
            <div className="mt-auto space-y-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Domains</span>
                  <span className="text-xs font-black text-slate-900">{subject.topics?.[0]?.count || 0} Nodes</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tasks</span>
                  <span className="text-xs font-black text-slate-900">{mcqCount} MCQs</span>
                </div>
              </div>
              
              {/* Progress Bar Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span>Neural Integration</span>
                  <span className="text-slate-900">{progress}%</span>
                </div>
                <div className="w-full bg-slate-50 rounded-full h-2 overflow-hidden shadow-inner p-0.5 border border-slate-100">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.05 }}
                    className="h-full rounded-full shadow-[0_0_12px_rgba(14,165,233,0.3)]" 
                    style={{ backgroundColor: hex }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-500">
                  Access Protocol
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-500">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
