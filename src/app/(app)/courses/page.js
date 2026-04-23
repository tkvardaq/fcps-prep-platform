'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Layers, 
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react'

// FCPS Part 1 Gynae & Obs Course Structure
const COURSES = [
  {
    id: 'obs-basics',
    title: 'Obstetrics: Normal Pregnancy',
    description: 'Comprehensive study of maternal physiology, antenatal screening, and physiological labour management.',
    icon: '🤰',
    paper: 1,
    color: 'border-sky-200',
    accent: 'bg-sky-50 text-sky-600',
    difficulty: 'Foundation',
    estimatedHours: 40,
    modules: 6
  },
  {
    id: 'obs-high-risk',
    title: 'High Risk Obstetrics',
    description: 'Deep dive into hypertensive disorders, gestational diabetes, and complex obstetric emergencies.',
    icon: '⚠️',
    paper: 2,
    color: 'border-rose-200',
    accent: 'bg-rose-50 text-rose-600',
    difficulty: 'Advanced',
    estimatedHours: 55,
    modules: 7
  },
  {
    id: 'gynae-benign',
    title: 'Benign Gynaecology',
    description: 'Focus on menstrual health, endometriosis, and benign pelvic pathologies common in clinical practice.',
    icon: '🏥',
    paper: 2,
    color: 'border-indigo-200',
    accent: 'bg-indigo-50 text-indigo-600',
    difficulty: 'Intermediate',
    estimatedHours: 45,
    modules: 6
  },
  {
    id: 'gynae-onco',
    title: 'Gynaecological Oncology',
    description: 'Staging, management protocols, and screening strategies for female reproductive malignancies.',
    icon: '🎯',
    paper: 2,
    color: 'border-amber-200',
    accent: 'bg-amber-50 text-amber-600',
    difficulty: 'Advanced',
    estimatedHours: 35,
    modules: 5
  },
  {
    id: 'repro-med',
    title: 'Reproductive Medicine',
    description: 'Infertility workup, assisted reproduction technologies, and endocrinology of the female cycle.',
    icon: '🔬',
    paper: 2,
    color: 'border-emerald-200',
    accent: 'bg-emerald-50 text-emerald-600',
    difficulty: 'Intermediate',
    estimatedHours: 30,
    modules: 5
  },
  {
    id: 'anatomy-embryo',
    title: 'Anatomy & Embryology',
    description: 'Essential Paper 1 knowledge: Surgical anatomy of the pelvis and fetal developmental milestones.',
    icon: '🦴',
    paper: 1,
    color: 'border-slate-200',
    accent: 'bg-slate-50 text-slate-600',
    difficulty: 'Foundation',
    estimatedHours: 25,
    modules: 4
  }
]

export default function CoursesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'paper1', 'paper2'

  const filtered = COURSES.filter(c => {
    if (filter === 'paper1' && c.paper !== 1) return false
    if (filter === 'paper2' && c.paper !== 2) return false
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <main className="min-h-screen bg-[#FFFBFB] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
              <GraduationCap size={16} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Academic Curriculum</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight">
              Clinical Specializations
            </h1>
            <p className="text-slate-500 font-medium max-w-xl">
              Our structured modules cover 100% of the FCPS Part 1 Gynae & Obs curriculum with high-yield focus points.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search modules..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-80 bg-white border border-slate-100 rounded-[1.5rem] pl-14 pr-6 py-4 font-medium text-slate-900 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1.5 bg-slate-100 rounded-2xl flex gap-1">
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'paper1', label: 'Paper 1 Only' },
              { id: 'paper2', label: 'Paper 2 Only' },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  filter === item.id 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block" />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            {filtered.length} Subjects found
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(course => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group relative block">
              <div className={`h-full glass-card p-8 rounded-[2.5rem] border ${course.color} transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl overflow-hidden`}>
                {/* Content */}
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="text-5xl group-hover:scale-110 transition-transform duration-500">
                      {course.icon}
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${course.accent}`}>
                      {course.difficulty}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-black text-slate-900 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Layers size={14} className="text-slate-300" />
                        <span className="text-xs font-bold">{course.modules} Units</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} className="text-slate-300" />
                        <span className="text-xs font-bold">{course.estimatedHours}h</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>

                {/* Bottom Bar Indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-1.5 transition-all duration-500 opacity-20 group-hover:opacity-100 ${course.paper === 1 ? 'bg-primary' : 'bg-secondary'}`} />
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
              <Search size={40} />
            </div>
            <h2 className="text-2xl font-display font-black text-slate-900 mb-2">No matching specializations</h2>
            <p className="text-slate-500 font-medium">Try adjusting your search or filters to explore other areas.</p>
          </div>
        )}
      </div>
    </main>
  )
}
