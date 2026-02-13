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
        // Only return standard NextAuth fields that PrismaAdapter expects
        // Custom fields (fullName, role, sectionId) are handled in events.createUser
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
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
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id ?? ""
        token.role = (user as { role?: string }).role ?? "MEMBER"
        token.sectionId = (user as { sectionId?: string | null }).sectionId ?? null
        token.hasCompletedOnboarding = (user as { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding ?? false
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { hasCompletedOnboarding: true },
        })
        if (dbUser) {
          token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding
        }
      }
      return token
    },
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "slack") {
          const allowedTeamId = (process.env.SLACK_ALLOWED_TEAM_ID || "").trim()
          // Slack profile structure can vary between OpenID Connect and older OAuth
          const userTeamId = getSlackTeamId(profile).trim()
          
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
  events: {
    async createUser({ user }) {
      // When a user is created via OAuth, set fullName from their name
      if (user.id && user.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { fullName: user.name },
        })
        console.log(`[auth] Updated fullName for new user: ${user.email}`)
      }
    },
  },
})

function getSlackTeamId(profile: unknown): string {
  if (!profile || typeof profile !== "object") return ""

  const record = profile as Record<string, unknown>
  const teamId = record.team_id
  if (typeof teamId === "string") return teamId

  const team = record.team
  if (team && typeof team === "object") {
    const nestedId = (team as Record<string, unknown>).id
    if (typeof nestedId === "string") return nestedId
  }

  const openIdTeamId = record["https://slack.com/team_id"]
  if (typeof openIdTeamId === "string") return openIdTeamId

  return ""
}
