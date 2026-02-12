"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(true)
  const lastScrollTop = useRef(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isNavigatingRef = useRef(false)
  const navTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleNavClick = () => {
    if (navTimeoutRef.current) {
      clearTimeout(navTimeoutRef.current)
    }

    isNavigatingRef.current = true
    setHeaderVisible(true)

    // Reset lastScrollTop to current position to avoid stale comparisons
    if (scrollContainerRef.current) {
      lastScrollTop.current = scrollContainerRef.current.scrollTop
    }

    navTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false
      if (scrollContainerRef.current) {
        lastScrollTop.current = scrollContainerRef.current.scrollTop
      }
    }, 1200)
  }

  // Auto-scroll to top when pathname changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
      lastScrollTop.current = 0
    }
    const frame = requestAnimationFrame(() => handleNavClick())
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop
      
      // During navigation, always keep visible
      if (isNavigatingRef.current) {
        setHeaderVisible(true)
        return
      }

      // Always show at the very top
      if (currentScrollTop < 10) {
        setHeaderVisible(true)
      } else {
        // Hide when scrolling down (current > last + threshold)
        // Using a threshold of 10px to avoid jitter
        if (currentScrollTop > lastScrollTop.current + 10 && currentScrollTop > 64) {
          setHeaderVisible(false)
        } else if (currentScrollTop < lastScrollTop.current - 10) {
          // Show when scrolling up
          setHeaderVisible(true)
        }
      }
      
      lastScrollTop.current = currentScrollTop
    }

    container.addEventListener("scroll", handleScroll)
    return () => {
      container.removeEventListener("scroll", handleScroll)
      if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current)
    }
  }, [])

  return (
    <div className="flex h-[100dvh] bg-background overflow-hidden relative">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onNavClick={handleNavClick}
      />
      
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Mobile header with menu button */}
        <header 
          className={cn(
            "h-[calc(4rem+env(safe-area-inset-top))] flex items-end pb-3 gap-4 px-6 border-b border-border md:hidden bg-card/80 backdrop-blur-md absolute top-0 inset-x-0 z-30 transition-all duration-300 pt-[env(safe-area-inset-top)]",
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
          className="flex-1 overflow-auto pt-[calc(4rem+env(safe-area-inset-top))] md:pt-0"
        >
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
