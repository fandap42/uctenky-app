import { PrismaClient } from "@prisma/client"
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Forces Prisma Client refresh after schema migration
const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? (() => {
  console.log("[prisma] Initializing new PrismaClient with Adapter...")
  try {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ 
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
    
    // Check if models are attached
    if (process.env.NODE_ENV === "development") {
      const models = Object.keys(client).filter(k => !k.startsWith("$") && !k.startsWith("_"))
      console.log("[prisma] Client initialized with models:", models)
    }
    
    return client
  } catch (error) {
    console.error("[prisma] Failed to initialize PrismaClient:", error)
    throw error
  }
})()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
