"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with menu button */}
        <header className="h-16 flex items-center gap-4 px-4 border-b border-slate-800 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <span className="font-bold text-lg text-white">4FISuctenky</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
