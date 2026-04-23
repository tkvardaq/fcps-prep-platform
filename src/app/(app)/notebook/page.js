'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { StickyNote, Download, BookOpen, ExternalLink, FileText, BrainCircuit, Sparkles, Copy, Check } from 'lucide-react'
import { toast, Toaster } from 'sonner'

export default function NotebookPage() {
  const [notes, setNotes] = useState([])
  const [weakTopics, setWeakTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load saved notes
    const { data: notesData } = await supabase
      .from('notes')
      .select('*, topics(name, subjects(name))')
      .order('created_at', { ascending: false })
      .limit(20)

    setNotes(notesData || [])

    // Load weak topics for study recommendations
    const { data: weak } = await supabase
      .from('weak_topics')
      .select('*, topics(name), subjects(name)')
      .eq('user_id', user.id)
      .order('accuracy_percent', { ascending: true })
      .limit(10)

    setWeakTopics(weak || [])
    setLoading(false)
  }

  const exportForNotebookLM = () => {
    // Generate NotebookLM-compatible study document
    let content = `# FCPS Part 1 - Gynae & Obs Study Notes\n\n`
    content += `> Generated from FCPS Prep Platform\n`
    content += `> Date: ${new Date().toLocaleDateString()}\n\n`
    content += `---\n\n`

    // Add weak topics section
    if (weakTopics.length > 0) {
      content += `## 🔴 Priority Areas (Weak Topics)\n\n`
      weakTopics.forEach(w => {
        content += `- **${w.topics?.name}** (${w.subjects?.name}) — Current accuracy: ${w.accuracy_percent}%\n`
      })
      content += `\n---\n\n`
    }

    // Add notes
    if (notes.length > 0) {
      content += `## 📝 Study Notes\n\n`
      notes.forEach(note => {
        content += `### ${note.title || note.topics?.name}\n`
        content += `*Subject: ${note.topics?.subjects?.name || 'N/A'}*\n\n`
        
        // Strip HTML tags for plain text export
        const plainText = note.content_html?.replace(/<[^>]*>/g, '') || ''
        content += `${plainText}\n\n`
        content += `---\n\n`
      })
    }

    // Download as file
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FCPS_StudyNotes_${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Study notes exported! Upload this file to NotebookLM for AI-powered study.')
  }

  const copyNoteContent = (note, idx) => {
    const plainText = note.content_html?.replace(/<[^>]*>/g, '') || ''
    navigator.clipboard.writeText(plainText)
    setCopied(idx)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <StickyNote size={24} className="text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Compiling Archives</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-10 font-sans">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <div className="glass-card p-10 md:p-14 rounded-[3.5rem] border border-white/80 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10 duration-1000" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-xl mb-6">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Intelligence Repository</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 tracking-tight mb-4">
              Study <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Notebook</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">
              Synthesize your clinical insights for Google NotebookLM, Anki, and cross-platform analysis.
            </p>
          </div>

          <button
            onClick={exportForNotebookLM}
            className="group/btn bg-slate-900 hover:bg-primary text-white px-10 py-5 rounded-[2rem] font-display font-black transition-all duration-500 flex items-center gap-4 shrink-0 shadow-2xl active:scale-95 relative overflow-hidden"
          >
            <Download className="w-5 h-5 group-hover/btn:-translate-y-1 transition-transform" />
            <span className="uppercase tracking-[0.2em] text-xs relative z-10">Export Archives</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
          </button>
        </div>
      </div>

      {/* Modern How-To Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            title: 'Export Intelligence', 
            desc: 'Extract your complete clinical narrative as a structured Markdown protocol.', 
            icon: Download, 
            color: 'primary',
            bg: 'bg-blue-50/50' 
          },
          { 
            title: 'Neural Upload', 
            desc: 'Interface with NotebookLM to create a deep clinical context window for your AI assistant.', 
            icon: BrainCircuit, 
            color: 'secondary',
            bg: 'bg-purple-50/50' 
          },
          { 
            title: 'Synaptic Synthesis', 
            desc: 'Generate audio evaluations, flashcards, and cross-sectional insights from your data.', 
            icon: Sparkles, 
            color: 'teal',
            bg: 'bg-teal-50/50' 
          }
        ].map((step, i) => (
          <div key={i} className="glass-card p-8 rounded-[2.5rem] border border-white/80 shadow-lg hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${step.bg} rounded-full blur-[40px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000`} />
            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-xl group-hover:rotate-12 transition-transform duration-500">
                <step.icon size={28} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">{step.title}</h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Notes List (Left) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight flex items-center gap-4">
              Saved Archives 
              <span className="text-sm font-black bg-slate-100 px-3 py-1 rounded-lg text-slate-400">{notes.length}</span>
            </h2>
          </div>
          
          {notes.length > 0 ? (
            <div className="space-y-6">
              {notes.map((note, idx) => (
                <div key={note.id} className="glass-card p-8 md:p-10 rounded-[3rem] border border-white/80 shadow-md hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group">
                  <div className="flex items-start justify-between mb-8">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-display font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">{note.title || note.topics?.name}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{note.topics?.subjects?.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(note.created_at).toLocaleDateString()}</span>
                        {note.reference_books?.length > 0 && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-tight">{note.reference_books.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => copyNoteContent(note, idx)}
                      className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                      title="Copy archive content"
                    >
                      {copied === idx ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <p className="text-slate-600 text-base leading-relaxed line-clamp-4 font-medium italic">
                      &quot;{note.content_html?.replace(/<[^>]*>/g, '').slice(0, 400)}...&quot;
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/80 to-transparent group-hover:from-white/40 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card p-20 rounded-[4rem] border border-dashed border-slate-200 bg-slate-50/30 text-center space-y-6">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                <FileText className="w-12 h-12 text-slate-200 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight uppercase">Null Repository</h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto">Visit your clinical modules to synthesize AI-powered research notes and build your repository.</p>
              </div>
              <Link href="/subjects" className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl active:scale-95">
                Initialize Research
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar (Right) */}
        <div className="lg:col-span-4 space-y-10">
          <div className="space-y-6">
            <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight px-4">Neural Feedback</h2>
            
            {weakTopics.length > 0 ? (
              <div className="glass-card rounded-[3rem] border border-white/80 shadow-xl overflow-hidden group">
                <div className="p-8 bg-slate-900 text-white flex items-center gap-4">
                  <Activity size={24} className="text-primary animate-pulse" />
                  <p className="text-sm font-display font-black uppercase tracking-[0.2em]">Priority Vectors</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {weakTopics.map(w => (
                    <div key={w.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="space-y-1">
                        <p className="font-black text-slate-800 tracking-tight leading-tight">{w.topics?.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{w.subjects?.name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-display font-black ${w.accuracy_percent < 50 ? 'text-rose-500' : 'text-amber-500'}`}>
                          {w.accuracy_percent}%
                        </span>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Accuracy</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/quiz" className="block w-full p-6 text-center bg-slate-50 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  Initiate Recalibration
                </Link>
              </div>
            ) : (
              <div className="glass-card p-12 rounded-[3rem] border border-white/80 shadow-lg text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                  <BrainCircuit className="w-8 h-8 text-slate-200 animate-pulse" />
                </div>
                <p className="text-slate-400 text-sm font-medium leading-relaxed">No critical growth vectors identified. Maintain consistency.</p>
              </div>
            )}
          </div>

          {/* Clinical Toolset */}
          <div className="glass-card p-10 rounded-[3.5rem] border border-white/80 shadow-xl space-y-8 relative overflow-hidden group">
            <div className="absolute bottom-0 right-0 p-8 opacity-5 text-slate-900 -mr-8 -mb-8 group-hover:rotate-45 transition-transform duration-1000">
              <Stethoscope size={120} />
            </div>
            <h3 className="text-xl font-display font-black text-slate-900 tracking-tight">External Protocols</h3>
            <div className="space-y-4 relative z-10">
              {[
                { name: 'Google NotebookLM', url: 'https://notebooklm.google.com' },
                { name: 'Anki Flashcards', url: 'https://ankiweb.net' },
                { name: 'UpToDate Clinical', url: 'https://uptodate.com' }
              ].map((tool, i) => (
                <a 
                  key={i}
                  href={tool.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 text-sm font-black text-slate-800 border border-slate-100 group/item"
                >
                  <span className="uppercase tracking-widest text-[10px]">{tool.name}</span>
                  <ExternalLink className="w-4 h-4 text-slate-300 group-hover/item:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
