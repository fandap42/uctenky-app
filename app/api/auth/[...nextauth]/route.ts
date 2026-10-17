import { handlers } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { loginRateLimiter, getClientIpFromHeaders } from "@/lib/utils/rate-limit"

export const { GET } = handlers

export async function POST(req: NextRequest) {
  if (req.nextUrl.pathname === "/api/auth/callback/credentials") {
    const ip = getClientIpFromHeaders(req.headers)
    if (loginRateLimiter.isRateLimited(ip)) {
      return NextResponse.json(
        { url: new URL("/login?error=RateLimited", req.nextUrl).toString() },
        { status: 429 }
      )
    }
  }

  return handlers.POST(req)
}
