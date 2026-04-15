'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BookOpen, ChevronRight, Search, Sparkles, Flame, Trophy, GraduationCap, Brain, Stethoscope, FlaskConical, Pill, Bug, Microscope, HeartPulse, BarChart3, Heart, Baby, Bone, Beaker } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MOTIVATIONAL_QUOTES = [
  { text: "The only way to do great work is to love what you study.", author: "Adapted from Steve Jobs" },
  { text: "A doctor who doesn't study is like a surgeon with a butter knife.", author: "FCPS Wisdom" },
  { text: "You didn't come this far to only come this far. Keep grinding!", author: "Every FCPS Survivor" },
  { text: "Anatomy is just geography. You already know Google Maps.", author: "Dr. Optimist" },
  { text: "Pathology: Where every slide tells a story you'll forget by tomorrow.", author: "Honest Med Student" },
  { text: "Pharmacology is just memorizing side effects and pretending it's science.", author: "Every Trainee Ever" },
  { text: "Pass FCPS and you'll never have to explain what FCPS is again.", author: "Future Fellow" },
  { text: "Study hard, nap harder. Balance is key.", author: "Wise PG Trainee" },
  { text: "The Krebs cycle called. It wants you to stop ignoring it.", author: "Biochemistry Department" },
  { text: "One MCQ at a time. That's how mountains are climbed.", author: "FCPS Marathon Runner" },
  { text: "Your future patients are counting on you. No pressure though.", author: "Gentle Reminder" },
  { text: "Coffee + Past Papers = FCPS Success Formula", author: "Evidence-Based Medicine" },
  { text: "Remember: Ganong believed in you before you believed in yourself.", author: "BRS Physiology Fan" },
  { text: "First Aid isn't just a book, it's a lifestyle.", author: "Step 1 Veteran" },
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
  const [quote, setQuote] = useState(MOTIVATIONAL_QUOTES[0])
  
  const supabase = createClient()

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)])
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

      // Load MCQ counts per subject
      const { data: mcqData } = await supabase
        .from('mcqs')
        .select('subject_id')

      if (mcqData) {
        const counts = {}
        mcqData.forEach(m => {
          counts[m.subject_id] = (counts[m.subject_id] || 0) + 1
        })
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
  }, [])

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

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const paper1 = filteredSubjects.filter(s => s.paper_number === 1)
  const paper2 = filteredSubjects.filter(s => s.paper_number === 2)
  const activeSubjects = activeTab === 1 ? paper1 : paper2

  const totalMCQs = Object.values(mcqCountMap).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Hero Header with Quote */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-8 md:p-10"
      >
        {/* Sparkle particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute animate-pulse" style={{
              left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%`,
              animationDelay: `${i * 0.4}s`, animationDuration: `${2 + i * 0.3}s`
            }}>
              <Sparkles className="w-3 h-3 text-amber-400/30" />
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.2em]">FCPS Part I — Gynae & Obs</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
            Syllabus Mastery
          </h1>
          
          {/* Motivational Quote */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 mt-4 max-w-2xl">
            <p className="text-blue-100 text-sm md:text-base italic leading-relaxed">"{quote.text}"</p>
            <p className="text-blue-300/60 text-xs mt-2 font-medium">— {quote.author}</p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <BookOpen className="w-4 h-4 text-blue-300" />
              <span className="text-white/90 text-sm font-bold">{subjects.length} Subjects</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Brain className="w-4 h-4 text-purple-300" />
              <span className="text-white/90 text-sm font-bold">{totalMCQs.toLocaleString()} MCQs</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-white/90 text-sm font-bold">2 Papers</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search + Tab Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1">
          <button 
            onClick={() => setActiveTab(1)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 1 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">P1</span>
              Paper I — General
            </span>
          </button>
          <button 
            onClick={() => setActiveTab(2)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 2 ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-600 flex items-center justify-center text-[10px] font-black">P2</span>
              Paper II — Specialty
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            placeholder="Search subjects..."
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
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">No subjects found matching your search.</p>
        </div>
      )}
    </div>
  )
}

function SubjectCard({ subject, progress, mcqCount, index }) {
  const hex = subject.color_hex || '#3B82F6'
  const IconComponent = ICON_MAP[subject.icon_name] || BookOpen
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/subjects/${subject.id}`} className="block group">
        <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 h-full flex flex-col">
          
          {/* Gradient accent bar */}
          <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${hex}, ${hex}88)` }}></div>
          
          {/* Sparkle on hover */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Icon + Title */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${hex}15` }}>
                <IconComponent className="w-5 h-5" style={{ color: hex }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-base leading-snug line-clamp-2">{subject.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{subject.description}</p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="mt-auto pt-3 border-t border-slate-50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-3">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {subject.topics?.[0]?.count || 0} Topics
                  </span>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    {mcqCount} MCQs
                  </span>
                </div>
                
                <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                  progress > 0  
                    ? progress >= 70 ? 'bg-emerald-50 text-emerald-600' 
                    : progress >= 40 ? 'bg-amber-50 text-amber-600' 
                    : 'bg-blue-50 text-blue-600'
                  : 'bg-slate-50 text-slate-400'
                }`}>
                  {progress}%
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.05 }}
                  className="h-1.5 rounded-full" 
                  style={{ background: `linear-gradient(90deg, ${hex}, ${hex}cc)` }}
                />
              </div>

              {/* CTA */}
              <div className="flex items-center justify-end">
                <span className="text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  Study Now <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
