'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, BrainCircuit, Calendar, LineChart, Trophy } from 'lucide-react'
import clsx from 'clsx'

// Note: Trimmed fewer items for mobile bottom nav to fit properly
const navItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Study', href: '/subjects', icon: BookOpen },
  { name: 'Quiz', href: '/quiz', icon: BrainCircuit },
  { name: 'Plan', href: '/planner', icon: Calendar },
  { name: 'Stats', href: '/progress', icon: LineChart },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex justify-around items-center px-2 z-50 pb-safe">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center w-16 h-full space-y-1",
              isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <Icon className={clsx("w-6 h-6", isActive && "fill-blue-50")} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        )
      })}
    </div>
  )
}
