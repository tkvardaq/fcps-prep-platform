'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Loader2, PlayCircle, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateTopicNotes } from '@/app/actions/ai-actions'
import { toast } from 'sonner'

import React from 'react'

const supabase = createClient()

export default function NotesViewerPage({ params }) {
  const { id: topicId } = React.use(params)
  const [topic, setTopic] = useState(null)
  const [notes, setNotes] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    async function loadData() {
      // Load Topic & Subject
      const { data: topicData } = await supabase
        .from('topics')
        .select('*, subjects(*)')
        .eq('id', topicId)
        .single()
        
      if (topicData) {
        setTopic(topicData)
        
        // Try getting notes — actual table is "notes", columns: content_html
        const { data: notesData } = await supabase
          .from('notes')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          
        if (notesData) {
          setNotes(notesData)
        }
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [topicId])

  const handleGenerate = async () => {
    setGenerating(true)
    const toastId = toast.loading('Gemini AI is writing comprehensive notes for this topic...')
    
    try {
      const result = await generateTopicNotes(topicId)
      
      if (result.success) {
        toast.success('Notes generated successfully!', { id: toastId })
        // Reload notes from the "notes" table
        const { data: newNotes } = await supabase
          .from('notes')
          .select('*')
          .eq('topic_id', topicId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        setNotes(newNotes)
      } else {
        toast.error(result.error || 'Failed to generate notes', { id: toastId })
      }
    } catch (err) {
      toast.error('An unexpected error occurred', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
     return (
        <div className="flex justify-center items-center h-[50vh]">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
     )
  }

  if (!topic) {
    return (
      <div className="p-8 text-center text-slate-800">
        <h2 className="text-2xl font-bold mb-4">Topic not found</h2>
        <Link href="/subjects" className="text-blue-600 underline">Back to Subjects</Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      <Link href={`/subjects/${topic.subject_id}`} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {topic.subjects?.name}
      </Link>
      
      <div className="mb-8 p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 card-shadow">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-300 mb-2">
            <span>{topic.subjects?.name}</span>
            <span className="w-1 h-1 rounded-full bg-blue-300"></span>
            <span>Paper {topic.subjects?.paper_number}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{topic.name}</h1>
          <p className="text-slate-400">{topic.description}</p>
        </div>
        
        {notes && (
          <Link href={`/quiz?topic=${topic.id}`} className="shrink-0 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all flex items-center justify-center">
            <PlayCircle className="w-5 h-5 mr-2" /> Test Knowledge
          </Link>
        )}
      </div>

      {!notes ? (
        <div className="bg-white border text-center p-10 md:p-16 rounded-3xl border-slate-100 card-shadow flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">No Notes Generated Yet</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            These notes haven't been generated yet. You can use our AI engine to generate high-yield revision notes tailored for the FCPS Part 1 exam.
          </p>
          
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 disabled:opacity-70 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all flex items-center gap-2 card-shadow"
          >
            {generating ? (
               <><Loader2 className="w-5 h-5 animate-spin" /> Generating (takes ~15s)...</>
            ) : (
               <><Sparkles className="w-5 h-5" /> Generate AI Notes</>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-100 card-shadow prose prose-slate prose-blue max-w-none ai-content-block">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-8 pb-4 border-b border-slate-100">
             <div className="flex items-center">
               <Sparkles className="w-4 h-4 mr-1 text-blue-500" /> AI Generated
             </div>
             <div>Last Updated: {new Date(notes.created_at).toLocaleDateString()}</div>
          </div>
          
          {/* Render HTML from the notes table's content_html column */}
          <div dangerouslySetInnerHTML={{ __html: notes.content_html }} />
        </div>
      )}
      
    </div>
  )
}
