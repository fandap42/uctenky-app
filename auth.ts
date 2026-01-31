import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Slack from "next-auth/providers/slack"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

if (prisma && !('account' in prisma)) {
  console.error("[auth] CRITICAL: prisma.account is missing from Prisma client!")
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: prisma && 'account' in prisma ? PrismaAdapter(prisma) : undefined,
  providers: [
    Slack({
      clientId: process.env.AUTH_SLACK_ID,
      clientSecret: process.env.AUTH_SLACK_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          fullName: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "MEMBER",
          sectionId: null,
        }
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        console.log("[auth] authorize called with email:", credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] Missing credentials")
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        console.log("[auth] Looking up user:", email)
        const user = await prisma.user.findUnique({
          where: { email },
        })

        console.log("[auth] User found:", user ? "yes" : "no")
        if (!user || !user.passwordHash) {
          return null
        }

        console.log("[auth] Comparing passwords...")
        const isPasswordValid = await compare(password, user.passwordHash)
        console.log("[auth] Password valid:", isPasswordValid)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          sectionId: null,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "slack") {
          const allowedTeamId = (process.env.SLACK_ALLOWED_TEAM_ID || "").trim()
          // Slack profile structure can vary between OpenID Connect and older OAuth
          const userTeamId = ((profile as any)?.team_id || 
                            (profile as any)?.team?.id || 
                            (profile as any)?.["https://slack.com/team_id"] || "").trim()
          
          console.log(`[auth] Slack login attempt. Team ID: "${userTeamId}", Allowed: "${allowedTeamId}"`)

          if (!allowedTeamId) {
            console.error("[auth] SLACK_ALLOWED_TEAM_ID is not configured in .env!")
            return false
          }

          if (userTeamId !== allowedTeamId) {
            console.warn(`[auth] Slack login denied: Team ID mismatch ("${userTeamId}" !== "${allowedTeamId}")`)
            return false
          }
        }
        return true
      } catch (error) {
        console.error("[auth] CRITICAL ERROR in signIn callback:", error)
        return false
      }
    },
  },
})
