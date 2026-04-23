'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  PlayCircle, 
  Clock,
  Activity,
  FileText,
  ShieldCheck,
  Brain,
  Microscope,
  Stethoscope
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { generateTopicNotes } from '@/app/actions/ai-actions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
    const toastId = toast.loading('Gemini Clinical AI is synthesizing high-yield documentation...')
    
    try {
      const result = await generateTopicNotes(topicId)
      
      if (result.success) {
        toast.success('Protocol synthesized successfully!', { id: toastId })
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
        toast.error(result.error || 'Synthesis protocol failed', { id: toastId })
      }
    } catch (err) {
      toast.error('An unexpected neural error occurred', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

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
            <h2 className="text-sm font-display font-black text-slate-900 tracking-tight uppercase">Initializing Neural Uplink</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] animate-pulse">Retrieving Clinical Data</p>
          </div>
        </div>
     )
  }

  if (!topic) {
    return (
      <div className="p-8 text-center bg-[#FFFBFB] min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Domain Not Found</h2>
        <p className="text-slate-500 mt-2 font-medium">The requested topic identifier is outside current clinical scope.</p>
        <Link href="/subjects" className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
          Return to Registry
        </Link>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#FFFBFB] selection:bg-primary/10 font-sans">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10">
        
        <Link 
          href={`/subjects/${topic.subject_id}`} 
          className="inline-flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Registry / {topic.subjects?.name} / {topic.name}
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-slate-900 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl group"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.05] text-white -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-1000">
            <Stethoscope size={200} />
          </div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -ml-32 -mb-32" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                  {topic.subjects?.name}
                </span>
                <span className="w-1 h-1 rounded-full bg-primary" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Paper {topic.subjects?.paper_number}</span>
              </div>
              
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight leading-tight mb-2">
                  {topic.name}
                </h1>
                <p className="text-slate-400 font-medium text-lg max-w-xl">{topic.description || 'Clinical node awaiting systematic review'}</p>
              </div>
            </div>
            
            {notes && (
              <Link 
                href={`/quiz?topic=${topic.id}`} 
                className="shrink-0 px-8 py-4 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest rounded-[2rem] transition-all flex items-center justify-center shadow-2xl shadow-primary/20 hover:-translate-y-1 active:scale-95"
              >
                <PlayCircle className="w-5 h-5 mr-3" /> Execute Protocol
              </Link>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!notes ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border text-center p-12 md:p-24 rounded-[4rem] border-slate-100 shadow-xl flex flex-col items-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.03),transparent)] pointer-events-none" />
              
              <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500 shadow-inner">
                <Microscope size={40} className="group-hover:rotate-12 transition-transform duration-500" />
              </div>
              
              <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight uppercase mb-4">Documentation Missing</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                This clinical domain has not yet been synthesized. Activate the Gemini Neural Engine to generate high-yield, exam-calibrated revision notes.
              </p>
              
              <button 
                onClick={handleGenerate}
                disabled={generating}
                className="relative bg-slate-900 disabled:opacity-70 hover:bg-slate-800 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-2xl hover:-translate-y-1 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] transition-transform" />
                {generating ? (
                   <><Loader2 className="w-5 h-5 animate-spin" /> Synthesizing Protocol...</>
                ) : (
                   <><Sparkles className="w-5 h-5 text-primary" /> Generate Neural Notes</>
                )}
              </button>
              
              <p className="mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Synthesis Latency: ~15.0s</p>
            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black tracking-widest uppercase text-slate-900">Clinical Report</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Verified Protocol Output</p>
                  </div>
                </div>
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Clock size={12} />
                  Last Updated: {new Date(notes.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="bg-white p-10 md:p-16 rounded-[4rem] border border-slate-100 shadow-2xl prose prose-slate prose-blue max-w-none ai-content-block relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                
                {/* Render HTML from the notes table's content_html column */}
                <div 
                  className="relative z-10 clinical-report-content"
                  dangerouslySetInnerHTML={{ __html: notes.content_html }} 
                />
                
                <div className="mt-16 pt-8 border-t border-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-12 h-1 bg-slate-100 rounded-full" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">End of Clinical Documentation</p>
                  <button 
                    onClick={handleGenerate}
                    className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-primary/70 transition-colors flex items-center gap-2"
                  >
                    <Sparkles size={12} /> Re-Synthesize Protocol
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
    </main>
  )
}
