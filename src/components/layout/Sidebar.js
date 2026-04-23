'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BookOpen, 
  BrainCircuit, 
  Calendar, 
  LineChart, 
  Trophy, 
  FileText, 
  Settings, 
  Award, 
  GraduationCap, 
  StickyNote, 
  Library,
  ChevronRight,
  Stethoscope
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Courses', href: '/courses', icon: GraduationCap },
  { name: 'Study', href: '/subjects', icon: BookOpen },
  { name: 'Quiz', href: '/quiz', icon: BrainCircuit },
  { name: 'Mock Exam', href: '/mock-exam', icon: Award },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Revision', href: '/revision', icon: FileText },
  { name: 'Progress', href: '/progress', icon: LineChart },
  { name: 'Notebook', href: '/notebook', icon: StickyNote },
  { name: 'Library', href: '/resources', icon: Library },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 text-slate-600 h-screen sticky top-0 overflow-hidden shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
      <div className="h-24 flex items-center px-10">
        <Link href="/dashboard" className="flex items-center gap-4 group">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-xl transition-transform group-hover:scale-110 duration-500">
            <Stethoscope className="w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-black text-slate-900 tracking-tighter">
            FCPS<span className="text-primary">.ai</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-8 px-6 space-y-2 custom-scrollbar">
        <div className="px-4 mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Protocol</span>
        </div>
        
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "group flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all duration-300 font-bold text-sm",
                isActive 
                  ? "bg-slate-900 text-white shadow-2xl shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center space-x-4">
                <Icon className={clsx("w-5 h-5 transition-all duration-500", isActive ? "text-primary scale-110" : "text-slate-300 group-hover:text-slate-900")} />
                <span className={clsx("tracking-tight transition-all", isActive ? "translate-x-1" : "group-hover:translate-x-1")}>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-primary animate-in slide-in-from-left-2 duration-300" />}
            </Link>
          )
        })}
      </div>

      <div className="p-8 border-t border-slate-50">
        <Link 
          href="/settings"
          className={clsx(
            "flex items-center space-x-4 px-5 py-4 rounded-[1.5rem] transition-all duration-300 font-bold text-sm",
            pathname === '/settings' ? "bg-slate-900 text-white shadow-2xl shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Settings className={clsx("w-5 h-5 transition-all", pathname === '/settings' ? "text-primary scale-110" : "text-slate-300")} />
          <span className="tracking-tight">System Settings</span>
        </Link>
      </div>
    </div>
  )
}

