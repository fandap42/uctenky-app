import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ""
        token.role = (user as { role?: string }).role ?? "MEMBER"
        token.sectionId = (user as { sectionId?: string | null }).sectionId ?? null
        token.hasCompletedOnboarding = (user as { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding ?? false
        if (user.image) {
          token.image = user.image
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.sectionId = token.sectionId as string | null
        session.user.hasCompletedOnboarding = token.hasCompletedOnboarding as boolean
        if (token.image || token.picture) {
          session.user.image = (token.image || token.picture) as string
        }
      }
      return session
    },
  },
  providers: [], // Configured in auth.ts
  trustHost: true,
} satisfies NextAuthConfig
