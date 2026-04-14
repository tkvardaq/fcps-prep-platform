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
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <Toaster richColors position="top-center" />

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <StickyNote className="w-8 h-8 text-blue-600" /> Study Notebook
            </h1>
            <p className="text-slate-500">
              Export your notes and weak areas for Google NotebookLM, Anki, or custom study tools.
            </p>
          </div>

          <button
            onClick={exportForNotebookLM}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shrink-0"
          >
            <Download className="w-5 h-5" /> Export for NotebookLM
          </button>
        </div>
      </div>

      {/* NotebookLM How-To */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 p-6">
        <h2 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" /> Use with Google NotebookLM
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold mb-2">1</div>
            <p className="font-bold text-slate-800 mb-1">Export Notes</p>
            <p className="text-slate-600">Click &quot;Export for NotebookLM&quot; to download your complete study notes as a Markdown file.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold mb-2">2</div>
            <p className="font-bold text-slate-800 mb-1">Upload to NotebookLM</p>
            <p className="text-slate-600">Go to <a href="https://notebooklm.google.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">notebooklm.google.com</a> and create a new notebook. Upload the file as a source.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl">
            <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center font-bold mb-2">3</div>
            <p className="font-bold text-slate-800 mb-1">Get AI Study Aid</p>
            <p className="text-slate-600">Ask questions, generate audio overviews, create flashcards, and get deep insights from your notes.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Notes List (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Your Study Notes ({notes.length})</h2>
          
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note, idx) => (
                <div key={note.id} className="bg-white rounded-2xl border border-slate-100 card-shadow p-5 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{note.title || note.topics?.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {note.topics?.subjects?.name} · {new Date(note.created_at).toLocaleDateString()}
                        {note.reference_books?.length > 0 && ` · ${note.reference_books.join(', ')}`}
                      </p>
                    </div>
                    <button
                      onClick={() => copyNoteContent(note, idx)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-2"
                      title="Copy note content"
                    >
                      {copied === idx ? <Check className="w-4 h-4 text-teal-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Preview */}
                  <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {note.content_html?.replace(/<[^>]*>/g, '').slice(0, 300)}...
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-12 text-center">
              <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Notes Yet</h3>
              <p className="text-slate-500 text-sm">Visit a topic from the Subjects page to generate AI-powered study notes.</p>
            </div>
          )}
        </div>

        {/* Sidebar - Weak Areas + Quick Links (1/3) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Focus Areas</h2>
          
          {weakTopics.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 card-shadow overflow-hidden">
              <div className="p-4 bg-orange-50 border-b border-orange-100">
                <p className="text-sm font-bold text-orange-800">⚡ Topics Needing Review</p>
              </div>
              <div className="divide-y divide-slate-50">
                {weakTopics.map(w => (
                  <div key={w.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{w.topics?.name}</p>
                      <p className="text-xs text-slate-500">{w.subjects?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-600">{w.accuracy_percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-6 text-center">
              <BrainCircuit className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No weak areas identified yet. Keep practicing!</p>
            </div>
          )}

          {/* External Links */}
          <div className="bg-white rounded-2xl border border-slate-100 card-shadow p-5">
            <h3 className="font-bold text-slate-900 mb-4">AI Study Tools</h3>
            <div className="space-y-2">
              <a href="https://notebooklm.google.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-800">
                <span>Google NotebookLM</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
              <a href="https://ankiweb.net" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-800">
                <span>Anki Flashcards</span>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
