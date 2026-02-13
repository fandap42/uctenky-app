import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      sectionId: string | null
      hasCompletedOnboarding: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string
    sectionId?: string | null
    hasCompletedOnboarding?: boolean
  }

  interface AdapterUser extends User {
    role?: string
    sectionId?: string | null
    hasCompletedOnboarding?: boolean
  }

  interface Profile {
    ok?: boolean
    team_id?: string
    team?: string
    user_id?: string
    user?: string
    groups?: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    sectionId: string | null
    hasCompletedOnboarding: boolean
  }
}
