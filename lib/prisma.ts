import { PrismaClient } from "@prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'
import { logger } from "@/lib/logger"

// Forces Prisma Client refresh after schema migration
const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? (() => {
  try {
    const adapter = new PrismaPg({ connectionString })
    const client = new PrismaClient({ 
      adapter,
      log: []
    })
    
    return client
  } catch (error) {
    logger.error({ err: error }, "[prisma] Failed to initialize PrismaClient")
    throw error
  }
})()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
