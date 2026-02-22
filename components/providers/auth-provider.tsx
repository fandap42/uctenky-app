"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Handle loading status as requested in PR review
    if (status === "loading") return

    // If the session expires or is missing, and the user is on a protected route, log them out/redirect.
    if (status === "unauthenticated" && pathname.startsWith("/dashboard")) {
      router.push("/login")
    }
  }, [status, pathname, router])

  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SessionGuard>{children}</SessionGuard>
    </SessionProvider>
  )
}
