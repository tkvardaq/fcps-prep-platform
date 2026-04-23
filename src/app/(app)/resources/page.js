'use client'

import React from 'react'
import { BookOpen, FileText, Download, Target, ChevronRight, Archive, Sparkles, Database } from "lucide-react"
import clsx from 'clsx'

const resources = [
  {
    title: "SK 19 Clean PDF",
    description: "Medicalstudyzone.com - SK 19 Clean Edition",
    type: "PDF",
    icon: <FileText className="h-8 w-8" />,
    link: "/resources/SK_19.pdf",
    color: "text-blue-600",
    bg: "bg-blue-50/50"
  },
  {
    title: "Rafi Golden 14",
    description: "Medicine Feb plus May 22 Edition",
    type: "PDF",
    icon: <BookOpen className="h-8 w-8" />,
    link: "/resources/Rafi_Golden_14_Medicine.pdf",
    color: "text-amber-600",
    bg: "bg-amber-50/50"
  },
  {
    title: "SK Pink 4th Edition",
    description: "August 2022 Edition",
    type: "PDF",
    icon: <BookOpen className="h-8 w-8" />,
    link: "/resources/Sk_Pink_4th_Edition.pdf",
    color: "text-pink-600",
    bg: "bg-pink-50/50"
  },
  {
    title: "Rafiullah 13th Edition",
    description: "Selected text excerpts and high-yield notes",
    type: "TXT",
    icon: <FileText className="h-8 w-8" />,
    link: "/resources/Rafiullah-13th-Edition.txt",
    color: "text-emerald-600",
    bg: "bg-emerald-50/50"
  },
  {
    title: "Gynae/Obs Syllabus",
    description: "Official FCPS Part 1 Gynae/Obs Syllabus",
    type: "PDF",
    icon: <Target className="h-8 w-8" />,
    link: "/resources/gynae_obs_syllabus.pdf",
    color: "text-purple-600",
    bg: "bg-purple-50/50"
  }
]

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] p-4 md:p-10 lg:p-16">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Premium Header */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-slate-900 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 opacity-40" />
              <Archive size={36} className="relative z-10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.25em] rounded-full shadow-lg">
                  Clinical Knowledge Base
                </span>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">High-Yield Archives</span>
              </div>
              <h1 className="text-5xl font-display font-black text-slate-900 tracking-tight">Clinical <span className="text-primary">Archives</span></h1>
              <p className="text-slate-500 font-medium text-lg max-w-xl">
                Access curated, high-fidelity reference materials and official syllabi for clinical mastery.
              </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-3 px-6 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Database size={20} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">System Capacity</span>
              <span className="text-[9px] font-bold text-slate-400">1.2GB Encrypted Assets</span>
            </div>
          </div>
        </header>

        {/* Resources Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, i) => (
            <div key={i} className="glass-card rounded-[3rem] border border-white/80 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col">
              <div className={clsx(
                "p-12 flex justify-center items-center transition-transform duration-700 group-hover:scale-105",
                resource.bg, resource.color
              )}>
                <div className="p-6 bg-white/40 backdrop-blur-md rounded-[2rem] shadow-inner border border-white/20 group-hover:rotate-6 transition-transform duration-500">
                  {resource.icon}
                </div>
              </div>
              
              <div className="p-10 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-display font-black text-slate-900 tracking-tight">{resource.title}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{resource.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 rounded-lg">
                    {resource.type}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                  <a 
                    href={resource.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-slate-900 text-white px-6 py-4 rounded-2xl font-display font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl hover:shadow-slate-200 flex items-center justify-center gap-2 group/btn"
                  >
                    View Module <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                  <a 
                    href={resource.link} 
                    download
                    className="p-4 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-100 transition-all hover:shadow-md active:scale-90"
                    title="Download Archive"
                  >
                    <Download size={20} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Info Box */}
        <footer className="glass-card rounded-[3.5rem] border border-white/80 p-12 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-r from-white/80 to-slate-50/80">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner border border-amber-100">
              <Sparkles size={28} />
            </div>
            <div>
              <h4 className="text-xl font-display font-black text-slate-900 tracking-tight">Missing high-yield content?</h4>
              <p className="text-slate-400 font-medium">Contribute clinical modules to the archives.</p>
            </div>
          </div>
          <button className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-display font-black text-[10px] uppercase tracking-[0.2em] border border-slate-100 hover:border-primary transition-all shadow-sm">
            Request Resource
          </button>
        </footer>
      </div>
    </main>
  )
}
