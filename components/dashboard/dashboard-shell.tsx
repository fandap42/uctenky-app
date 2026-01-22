"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollTop = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop
      
      // Always show at top or if scrolling up by more than 10px
      if (currentScrollTop < 10) {
        setHeaderVisible(true)
      } else if (currentScrollTop > lastScrollTop.current && currentScrollTop > 64) {
        // Scrolling down and past header height
        setHeaderVisible(false)
      } else if (currentScrollTop < lastScrollTop.current - 10) {
        // Scrolling up by threshold
        setHeaderVisible(true)
      }
      
      lastScrollTop.current = currentScrollTop
    }

    container.addEventListener("scroll", handleScroll)
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Mobile header with menu button */}
        <header 
          className={cn(
            "flex-none h-[calc(4rem+env(safe-area-inset-top))] flex items-end pb-3 gap-4 px-6 border-b border-border md:hidden bg-card/80 backdrop-blur-md sticky top-0 z-30 transition-all duration-300 pt-[env(safe-area-inset-top)]",
            headerVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <span className="font-bold text-lg text-foreground">4FISuctenky</span>
        </header>

        {/* Main content */}
        <main 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
        >
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
