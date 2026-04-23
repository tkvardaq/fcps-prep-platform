import { getDashboardData } from '@/actions/dashboard'
import Link from 'next/link'
import { 
  Trophy, 
  Target, 
  Zap, 
  Activity, 
  ChevronRight, 
  BookOpen,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Circle,
  BarChart3,
  Stethoscope,
  Sparkles,
  ClipboardList
} from 'lucide-react'
import clsx from 'clsx'

export const dynamic = 'force-dynamic'

const CLINICAL_INSIGHTS = [
  { text: "Precision in foundational concepts dictates clinical outcomes.", author: "Diagnostic Protocol" },
  { text: "Systematic review of pathology reveals the underlying physiological truth.", author: "Clinical Methodology" },
  { text: "High-yield mastery is built through consistent neural recalibration.", author: "Board Review Strategy" },
  { text: "A physician's capability is directly proportional to their baseline knowledge.", author: "Medical Registry" },
  { text: "Protocol adherence and systematic study ensure assessment success.", author: "Fellowship Standards" },
]

export default async function DashboardPage() {
  const response = await getDashboardData()
  const dayOfMonth = new Date().getDate()
  const insight = CLINICAL_INSIGHTS[dayOfMonth % CLINICAL_INSIGHTS.length]
  
  if (!response.success) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-6 bg-[#FFFBFB]">
        <div className="glass-card p-12 rounded-[4rem] text-center max-w-md border-rose-100/50 shadow-2xl bg-white">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <Activity size={40} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-display font-black text-slate-900 mb-4 tracking-tight uppercase">Clinical Sync Interrupted</h1>
          <p className="font-sans text-slate-500 mb-10 leading-relaxed font-bold text-sm tracking-tight">{response.message}</p>
          <button 
            onClick="window.location.reload()" 
            className="w-full bg-slate-900 text-white px-8 py-6 rounded-[2rem] font-display font-black shadow-2xl hover-lift tap-shrink tracking-[0.25em] text-[10px]"
          >
            RESTORE CONNECTION
          </button>
        </div>
      </div>
    )
  }

  const { profile, stats, subject_progress, today_schedule } = response.data
  
  const daysToExam = profile?.exam_date 
    ? Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  const statCards = [
    { label: 'MCQs Mastery', value: stats?.total_attempts || 0, icon: Target, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' },
    { label: 'Clinical Accuracy', value: `${stats?.accuracy || 0}%`, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
    { label: 'Daily Momentum', value: `${stats?.streak || 0}d`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
    { label: 'Readiness Index', value: `${Math.min(100, Math.round((stats?.accuracy || 0) * 0.8))}%`, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/5', border: 'border-indigo-500/10' },
  ]

  return (
    <main className="min-h-screen bg-[#FFFBFB] p-4 md:p-10 lg:p-16 selection:bg-primary/10">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Superior Clinical Header */}
        <header className="relative flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12 pb-12 border-b border-slate-100">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[4rem] bg-slate-900 flex items-center justify-center text-white text-6xl font-display font-black shadow-[0_40px_80px_-15px_rgba(15,23,42,0.4)] transition-all group-hover:scale-105 group-hover:rotate-3 duration-700 overflow-hidden relative border-4 border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-30 animate-gradient" />
                <span className="relative z-10 uppercase tracking-tighter">{profile?.full_name?.[0] || 'D'}</span>
              </div>
              <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-white rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-[#FFFBFB]">
                <div className="w-5 h-5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl flex items-center gap-3">
                  <ShieldCheck size={14} className="text-primary" />
                  ID: {profile?.id?.slice(0, 8) || 'FCPS-PROT'}
                </div>
                <div className="flex items-center gap-3 px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Active Duty</span>
                </div>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-display font-black text-slate-900 tracking-tight leading-[0.85] transition-all">
                Dr. {profile?.full_name?.split(' ')[0] || 'Clinician'}<span className="text-primary">.</span>
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-lg">
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-6 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                  <Calendar size={20} className="text-primary" />
                  {daysToExam > 0 ? (
                    <p className="text-slate-600">Chronology: <span className="text-slate-900 font-black tracking-tight">{daysToExam} Days</span> to Assessment</p>
                  ) : (
                    <p className="uppercase tracking-widest text-xs font-black text-primary">Residency Cycle: Terminal Phase</p>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm px-6 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                  <Activity size={20} className="text-secondary" />
                  <p className="text-slate-600">Sync: <span className="text-slate-900 font-black tracking-tight">100% Secure</span></p>
                </div>
              </div>
            </div>
          </div>
          
          <Link 
            href="/quiz"
            className="group relative inline-flex items-center gap-8 bg-slate-900 text-white pl-16 pr-14 py-8 rounded-[3.5rem] font-display font-black transition-all hover:shadow-[0_50px_100px_rgba(15,23,42,0.4)] active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-20 transition-opacity duration-700 animate-gradient" />
            <div className="flex flex-col items-start relative z-10">
              <span className="uppercase tracking-[0.4em] text-[10px] opacity-50 mb-1">Initialization</span>
              <span className="uppercase tracking-[0.2em] text-sm">Launch Protocol</span>
            </div>
            <div className="relative z-10 w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-all border border-white/10 shadow-inner group-hover:rotate-12">
              <ChevronRight size={36} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </header>

        {/* Clinical Vitality Matrix */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {statCards.map((item, idx) => (
            <div key={idx} className={`bg-white p-10 md:p-12 rounded-[4.5rem] border border-slate-100/50 hover:border-primary/30 hover:-translate-y-3 shadow-sm group relative overflow-hidden transition-all duration-700 hover:shadow-[0_80px_120px_-40px_rgba(0,0,0,0.1)]`}>
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-1000 group-hover:scale-125 group-hover:rotate-12">
                <item.icon size={180} />
              </div>
              
              <div className="flex items-center justify-between mb-12">
                <div className={`${item.bg} ${item.color} w-20 h-20 rounded-[2.25rem] flex items-center justify-center shadow-inner border border-white group-hover:rotate-12 transition-all duration-700`}>
                  <item.icon size={36} />
                </div>
                <div className="h-10 w-24 relative overflow-hidden rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center px-4">
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-emerald-500/10 group-hover:h-8 transition-all duration-700" />
                  <svg className="w-full h-4 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0 10 Q 25 5, 50 10 T 100 10" fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-slate-300 font-black text-[11px] uppercase tracking-[0.3em]">{item.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-5xl md:text-6xl font-display font-black text-slate-900 tracking-tighter leading-none">{item.value}</p>
                  <div className="mb-2 flex items-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 shadow-sm group-hover:scale-110 transition-transform">
                    <ArrowUpRight size={16} strokeWidth={4} />
                    <span className="text-[10px] font-black">2.4%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
          
          {/* Advanced Discipline Board */}
          <section className="lg:col-span-8 bg-white p-12 md:p-20 rounded-[5rem] border border-slate-100 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[180px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10 duration-1000 animate-pulse" />
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-2xl border-4 border-white group-hover:rotate-6 transition-transform">
                    <BarChart3 size={28} />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-5xl font-display font-black text-slate-900 tracking-tight uppercase leading-none">
                      Neural Analytics
                    </h2>
                    <p className="text-slate-400 text-lg font-bold tracking-tight">Cross-sectional performance distribution</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 px-8 py-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl border border-white/10 group/btn hover:scale-105 transition-transform cursor-pointer">
                <span className="text-[11px] font-black uppercase tracking-[0.3em]">Full Assessment Report</span>
                <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-20 relative z-10">
              {(subject_progress || []).slice(0, 8).map((subject, idx) => {
                const percentage = Math.round((subject.correct / subject.total) * 100 || 0);
                return (
                  <div key={idx} className="group/item cursor-default relative">
                    <div className="flex justify-between items-end mb-6">
                      <div className="space-y-2">
                        <span className="font-display font-black text-slate-900 group-hover/item:text-primary transition-all text-3xl tracking-tighter block leading-none">
                          {subject.subject_name}
                        </span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-hover/item:text-slate-400 transition-colors">
                            <Target size={14} className="opacity-50" />
                            <span>{subject.attempted} Cases</span>
                          </div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
                          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            Confidence: <span className="text-slate-900">High</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-4xl font-display font-black transition-all group-hover/item:scale-110 block leading-none ${percentage > 75 ? 'text-emerald-500' : percentage > 50 ? 'text-amber-500' : 'text-slate-200'}`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="h-5 w-full bg-slate-50 rounded-[1rem] overflow-hidden border border-slate-100 p-1.5 shadow-inner relative group-hover/item:shadow-md transition-shadow">
                      <div 
                        className={`h-full rounded-full transition-all duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm relative z-10 ${
                          percentage > 75 ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600' : 
                          percentage > 50 ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600' : 
                          'bg-gradient-to-r from-slate-200 to-slate-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-12 md:gap-16">
            
            {/* Daily Protocol Monitor */}
            <div className="bg-white p-14 rounded-[5rem] border border-slate-100 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-2xl transition-all duration-700">
              <div className="absolute top-0 right-0 p-12 opacity-[0.04] text-slate-900 group-hover:scale-110 transition-transform duration-1000 group-hover:rotate-6">
                <ClipboardList size={220} />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-16">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-display font-black text-slate-900 tracking-tight uppercase leading-none">
                      Protocol
                    </h3>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] italic">Operational Phase: Active</p>
                  </div>
                  <div className="bg-slate-900 text-white w-20 h-24 rounded-[2.25rem] shadow-2xl flex flex-col items-center justify-center border-4 border-white group-hover:scale-110 transition-transform">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">
                      {new Date().toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-3xl font-display font-black leading-none">
                      {new Date().toLocaleDateString('en-GB', { day: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="space-y-8">
                  {today_schedule?.length > 0 ? (
                    today_schedule.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-6 p-7 rounded-[3rem] bg-slate-50/50 border border-slate-100/50 group-hover:bg-white group-hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center bg-white shadow-xl text-primary group-hover:bg-primary group-hover:text-white transition-all border border-slate-100">
                          <CheckCircle2 size={32} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xl font-black text-slate-900 truncate tracking-tight mb-1">{item.topics?.name || 'Critical Path'}</p>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.subjects?.name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.hours_allocated}H Focus</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-slate-50/30 rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center group/empty">
                      <div className="w-28 h-28 bg-white rounded-[3rem] flex items-center justify-center mb-8 shadow-inner border border-slate-50 group-hover/empty:scale-110 transition-transform duration-700">
                        <Stethoscope size={48} className="text-slate-100 animate-pulse" />
                      </div>
                      <p className="text-slate-400 text-sm font-black tracking-[0.2em] px-12 leading-relaxed uppercase">Clinical Queue Stabilized. <br />Initialize Calibration Cycle.</p>
                      <Link href="/planner" className="mt-12 inline-flex items-center gap-4 bg-slate-900 text-white px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-primary transition-all shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] active:scale-95 border border-white/10">
                        Access Neural Planner
                        <ChevronRight size={18} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Neural Feedback Hub */}
            <div className="bg-slate-900 p-16 rounded-[5rem] shadow-[0_60px_150px_-30px_rgba(15,23,42,0.6)] text-white relative overflow-hidden group border border-white/5 transition-all duration-700 hover:shadow-[0_80px_200px_-40px_rgba(14,165,233,0.5)]">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="inline-flex items-center gap-4 px-8 py-4 bg-white/5 rounded-2xl border border-white/10 mb-16 backdrop-blur-2xl">
                    <div className="relative">
                      <Zap size={24} className="text-primary fill-primary animate-pulse" />
                      <div className="absolute inset-0 bg-primary/40 blur-xl animate-pulse" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Intelligence Stream</span>
                  </div>
                  
                  <h3 className="text-7xl font-display font-black mb-12 leading-[0.85] tracking-tighter">
                    Synaptic <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary bg-[length:200%_auto] animate-gradient">Recalibration</span>
                  </h3>
                  
                  <div className="space-y-12">
                    <div className="flex gap-8 items-start">
                      <div className="w-1.5 h-24 bg-gradient-to-b from-primary via-secondary to-transparent rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)]" />
                      <p className="text-slate-300 font-bold leading-relaxed text-2xl tracking-tight">
                        Our protocol identifies <span className="text-white font-black underline decoration-primary/50 decoration-8 underline-offset-8">Pharmacodynamics</span> as your optimal path to proficiency.
                      </p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                      <div className="pl-8">
                        <p className="italic text-slate-400 text-xl leading-relaxed font-medium mb-6">
                          &quot;{insight.text}&quot;
                        </p>
                        <div className="flex items-center gap-4">
                          <span className="h-px w-8 bg-slate-800" />
                          <p className="text-primary text-[10px] font-black uppercase tracking-[0.4em]">— {insight.author}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/quiz"
                  className="group/btn w-full bg-white text-slate-900 font-display font-black py-10 rounded-[3rem] shadow-2xl hover:bg-primary hover:text-white transition-all duration-700 active:scale-95 mt-24 text-center relative overflow-hidden flex items-center justify-center gap-6"
                >
                  <span className="relative z-10 uppercase tracking-[0.4em] text-xs">Execute Mastery Protocol</span>
                  <div className="w-10 h-10 rounded-2xl bg-slate-900/5 group-hover/btn:bg-white/20 transition-all flex items-center justify-center relative z-10">
                    <ChevronRight size={28} className="group-hover/btn:translate-x-2 transition-transform" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-700 animate-gradient" />
                </Link>
              </div>

              {/* Advanced Visual Effects */}
              <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] -mr-48 -mt-48 group-hover:bg-primary/30 transition-all duration-1000" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px] -ml-40 -mb-40 group-hover:bg-secondary/20 transition-all duration-1000" />
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            {/* Performance Sentinel */}
            <Link 
              href="/progress"
              className="bg-white p-12 rounded-[4.5rem] border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white transition-all duration-700 shadow-sm hover:shadow-[0_80px_120px_-30px_rgba(0,0,0,0.08)] relative overflow-hidden"
            >
              <div className="flex items-center gap-10 relative z-10">
                <div className="w-24 h-24 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] relative border-4 border-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-transparent" />
                  <BarChart3 size={40} className="relative z-10" />
                </div>
                <div>
                  <p className="text-slate-300 font-black text-[11px] uppercase tracking-[0.3em] mb-2 italic">Performance Analytics</p>
                  <p className="text-slate-900 font-display font-black text-3xl tracking-tighter leading-none">Clinical Baseline Report</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">Accuracy +4%</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Last updated: 14m ago</span>
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-700 shadow-inner group-hover:shadow-2xl">
                <ArrowUpRight size={32} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </Link>

          </div>
        </div>
      </div>
    </main>

  )
}
