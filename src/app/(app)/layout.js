import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import Header from '@/components/layout/Header'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
