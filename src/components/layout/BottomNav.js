'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, BrainCircuit, Calendar, LineChart } from 'lucide-react'
import clsx from 'clsx'

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
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center px-4 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center w-16 h-full transition-all duration-300 relative group",
              isActive ? "text-primary" : "text-slate-400"
            )}
          >
            {isActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full animate-in slide-in-from-top-2 duration-500" />
            )}
            <Icon className={clsx("w-6 h-6 transition-all duration-500", isActive ? "scale-110 drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]" : "group-hover:text-slate-900 group-hover:scale-110")} />
            <span className={clsx("text-[9px] font-black uppercase tracking-widest mt-1.5 transition-all", isActive ? "opacity-100" : "opacity-60")}>
              {item.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

