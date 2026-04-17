'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, BrainCircuit, Calendar, LineChart, Trophy, FileText, Settings, Award, GraduationCap, StickyNote, Library } from 'lucide-react'
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
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-rose-100/50 text-slate-600">
      <div className="h-20 flex items-center px-8">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500 rounded-2xl soft-glow-pink">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">FCPS<span className="text-rose-500 ml-1">✨</span></span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          // Map emojis to nav items for "playful" feel
          const emojiMap = {
            'Dashboard': '🏠',
            'Courses': '🎓',
            'Study': '📖',
            'Quiz': '🧠',
            'Mock Exam': '🎯',
            'Planner': '📅',
            'Revision': '🔄',
            'Progress': '📈',
            'Notebook': '📓',
            'Library': '📚',
            'Leaderboard': '🏆'
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm hover-lift",
                isActive 
                  ? "bg-rose-50 text-rose-600 shadow-sm border border-rose-100/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-rose-500"
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className={clsx("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-rose-500" : "text-slate-400")} />
                <span>{item.name}</span>
              </div>
              <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">{emojiMap[item.name]}</span>
            </Link>
          )
        })}
      </div>

      <div className="p-6 border-t border-rose-50">
        <Link 
          href="/settings"
          className="flex items-center space-x-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-500 hover:text-rose-500 transition-all font-bold text-sm hover-lift"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Settings</span>
          <span className="ml-auto text-xs">⚙️</span>
        </Link>
      </div>
    </div>
  )
}
