import { PrismaClient } from "@prisma/client"
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

// Forces Prisma Client refresh after schema migration
const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? (() => {
  try {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)
    const client = new PrismaClient({ 
      adapter,
      log: []
    })
    
    return client
  } catch (error) {
    console.error("[prisma] Failed to initialize PrismaClient:", error)
    throw error
  }
})()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
