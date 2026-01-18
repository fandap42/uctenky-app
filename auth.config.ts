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
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.sectionId = token.sectionId as string | null
      }
      return session
    },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
