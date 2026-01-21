import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { uploadRateLimiter } from "@/lib/utils/rate-limit"

const { auth } = NextAuth(authConfig)

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  )
}

function checkUploadRateLimit(req: NextRequest): NextResponse | null {
  if (req.nextUrl.pathname === "/api/upload" && req.method === "POST") {
    const ip = getClientIp(req)
    const result = uploadRateLimiter.check(ip)

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Příliš mnoho požadavků. Zkuste to prosím později." },
        { status: 429 }
      )
    }
  }
  return null
}

export default auth((req) => {
  // Rate limiting for upload endpoint
  const rateLimitResponse = checkUploadRateLimit(req as unknown as NextRequest)
  if (rateLimitResponse) return rateLimitResponse

  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register"
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")
  const isRoot = req.nextUrl.pathname === "/"

  // Redirect root to login or dashboard
  if (isRoot) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  // Redirect to dashboard if already logged in and accessing auth routes
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

