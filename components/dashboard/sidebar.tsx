"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PieChart,
  Users,
  LogOut,
  ChevronRight,
  Menu,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { isHeadRole, isAdmin } from "@/lib/utils/roles"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const mainNavigation = [
  { name: "Přehled", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: "Správa účtenek", href: "/dashboard/admin", icon: <Receipt className="w-5 h-5" />, role: "ADMIN" },
  { name: "Žádosti sekce", href: "/dashboard/head", icon: <Receipt className="w-5 h-5" />, role: "HEAD" },
  { name: "Pokladna", href: "/dashboard/pokladna", icon: <Wallet className="w-5 h-5" />, role: "ADMIN" },
  { name: "Rozpočty", href: "/dashboard/budget", icon: <PieChart className="w-5 h-5" />, role: "ADMIN" },
  { name: "Uživatelé", href: "/dashboard/users", icon: <Users className="w-5 h-5" />, role: "ADMIN" },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role || ""

  const filteredNavigation = mainNavigation.filter(item => {
    if (!item.role) return true
    if (item.role === "ADMIN") return isAdmin(userRole)
    if (item.role === "HEAD") return isHeadRole(userRole)
    return false
  })

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col h-full bg-card border-r border-border w-64 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
            <div className="flex items-center">
              <span className="text-3xl font-black text-[#000000]">4</span>
              <span className="text-3xl font-black text-primary">fis</span>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.icon}
                  </div>
                  {item.name}
                </div>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            )
          })}
        </nav>

        <Separator className="bg-border mx-4 w-auto" />

        {/* User section */}
        <div className="p-4">
          <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {session?.user?.name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {session?.user?.name || "Uživatel"}
                </p>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 h-4 border-primary/30 text-primary">
                  {userRole === "ADMIN" ? "Administrátor" : isHeadRole(userRole) ? "Vedoucí" : "Člen"}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/5 rounded-xl border-border"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" />
              <span>Odhlásit se</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variant === "outline" ? "border" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </span>
  )
}
