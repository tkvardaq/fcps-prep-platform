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
    <div className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <span className="text-xl font-bold text-white tracking-tight">FCPS Prep</span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm",
                isActive 
                  ? "bg-blue-600 text-white" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className={clsx("w-5 h-5", isActive ? "text-blue-200" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <Link 
          href="/settings"
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors font-medium text-sm"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  )
}
