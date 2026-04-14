'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, PlayCircle, BookOpen, Clock, Activity, CheckCircle2 } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

export default function SubjectDetailPage() {
  const params = useParams()
  const [subject, setSubject] = useState(null)
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Load Subject
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', params.id)
        .single()
        
      if (subjectData) {
        setSubject(subjectData)
        
        // Load Topics
        const { data: topicsData } = await supabase
          .from('topics')
          .select('*, notes(id)')
          .eq('subject_id', subjectData.id)
          .order('name', { ascending: true })
          
        if (topicsData) {
          setTopics(topicsData)
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [params.id])

  if (loading) {
     return (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="relative bg-white rounded-3xl overflow-hidden card-shadow border border-slate-100 p-8 md:p-10">
        <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: subject.color_hex || '#1E40AF' }}></div>
        
        <Link href="/subjects" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Subjects
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${subject.paper_number === 1 ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                Paper {subject.paper_number}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">{subject.name}</h1>
            <p className="text-slate-500 max-w-xl text-lg">{subject.description}</p>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => router.push(`/quiz?subject=${subject.id}`)} className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-700 rounded-xl font-bold transition-all flex items-center justify-center">
              <Activity className="w-5 h-5 mr-2" /> Mock Exam
            </button>
          </div>
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-1">Syllabus Topics ({topics.length})</h2>
        
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden card-shadow divide-y divide-slate-100">
          {topics.map((topic, idx) => {
            const hasNotes = topic.notes && topic.notes.length > 0;
            return (
              <div key={topic.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors">
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{topic.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1">{topic.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-medium text-slate-400 flex items-center">
                        <BookOpen className="w-3.5 h-3.5 mr-1" />
                        {hasNotes ? 'Notes Ready' : 'AI Generation Available'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:pl-4">
                  <Link href={`/study/${topic.id}`} className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center ${hasNotes ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <BookOpen className="w-4 h-4 mr-2" /> Read Notes
                  </Link>
                  <Link href={`/quiz?topic=${topic.id}`} className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-sm font-bold rounded-lg transition-colors flex items-center">
                    <PlayCircle className="w-4 h-4 mr-2" /> Practice
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      
    </div>
  )
}
