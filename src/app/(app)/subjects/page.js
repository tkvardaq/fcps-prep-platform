'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { BookOpen, Target, ChevronRight, Search, GraduationCap, Layers } from 'lucide-react'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [progressMap, setProgressMap] = useState({})
  
  const supabase = createClient()

  useEffect(() => {
    async function loadSubjects() {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('subjects')
        .select('*, topics(count)')
        .order('paper_number', { ascending: true })
        .order('name', { ascending: true })
        
      if (!error && data) {
        setSubjects(data)
      }

      // Load per-subject progress
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
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
     )
  }

  const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
  
  const paper1 = filteredSubjects.filter(s => s.paper_number === 1)
  const paper2 = filteredSubjects.filter(s => s.paper_number === 2)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-2xl border border-slate-100 card-shadow">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Subject Mastery</h1>
          <p className="text-slate-500">Master the syllabus, one topic at a time.</p>
        </div>
        
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {paper1.length > 0 && (
         <div className="space-y-4">
           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">P1</div>
             Paper 1 - Basic Sciences
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {paper1.map(subject => <SubjectCard key={subject.id} subject={subject} progress={progressMap[subject.id] || 0} />)}
           </div>
         </div>
      )}

      {paper2.length > 0 && (
         <div className="space-y-4 pt-4">
           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-sm">P2</div>
             Paper 2 - Clinical Specialities
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {paper2.map(subject => <SubjectCard key={subject.id} subject={subject} progress={progressMap[subject.id] || 0} />)}
           </div>
         </div>
      )}

    </div>
  )
}

function SubjectCard({ subject, progress }) {
  const hex = subject.color_hex || '#1E40AF'
  
  return (
    <Link href={`/subjects/${subject.id}`} className="block group">
       <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-slate-100 hover:border-blue-200 transition-all hover:-translate-y-1 hover:shadow-lg h-full flex flex-col">
         <div className="h-2 w-full" style={{ backgroundColor: hex }}></div>
         
         <div className="p-6 flex-1 flex flex-col">
           <div className="flex justify-between items-start mb-4">
             <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 pr-4">{subject.name}</h3>
             <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
           </div>
           
           <div className="mt-auto pt-4 border-t border-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-500 font-medium">
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  {subject.topics[0]?.count || 0} Topics
                </div>
                
                <div className={`text-sm font-bold px-2 py-1 rounded ${
                  progress > 0  
                    ? progress >= 70 ? 'bg-teal-100 text-teal-700' 
                    : progress >= 40 ? 'bg-amber-100 text-amber-700' 
                    : 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {progress}%
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: hex }}></div>
              </div>
           </div>
         </div>
       </div>
    </Link>
  )
}
