import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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
        if (!user) {
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
        }
      },
    }),
  ],
})
