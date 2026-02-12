import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import dotenv from "dotenv"

// Load env so DATABASE_URL is available when running directly
dotenv.config()

autoInit()

async function autoInit() {
  const prisma = await createPrismaClient()

  try {
    await seed(prisma)
    console.log("\n✅ Seed complete")
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

async function createPrismaClient() {
  try {
    const { PrismaPg } = await import("@prisma/adapter-pg")
    const { Pool } = await import("pg")

    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaPg(pool)

    return new PrismaClient({ adapter })
  } catch (error) {
    console.warn("Prisma adapter not available, falling back to default client.", error)
    return new PrismaClient()
  }
}

async function seed(prisma) {
  const sectionNames = [
    "Vedení",
    "Finance",
    "HR",
    "PR",
    "Nevzdělávací akce",
    "Vzdělávací akce",
    "Sportovní akce",
    "Gaming",
    "Kruhové akce",
  ]

  const sectionsMap = {}
  for (const name of sectionNames) {
    let section = await prisma.section.findFirst({ where: { name } })
    if (!section) {
      section = await prisma.section.create({ data: { name } })
      console.log(`Created section: ${name} (${section.id})`)
    } else {
      console.log(`Section exists: ${name} (${section.id})`)
    }
    sectionsMap[name] = section
  }

  // Users to create
  const users = [
    {
      email: "admin@test.com",
      fullName: "Admin User",
      password: "adminpass",
      role: "ADMIN",
    },
    {
      email: "head.finance@test.com",
      fullName: "Finance Head",
      password: "headpass",
      role: "HEAD_FINANCE",
      section: "Finance",
    },
    {
      email: "member@test.com",
      fullName: "Normal User",
      password: "memberpass",
      role: "MEMBER",
    },
  ]

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })
    if (existing) {
      console.log(`User already exists: ${user.email}`)
      continue
    }

    const passwordHash = bcrypt.hashSync(user.password, 10)

    const data = {
      email: user.email,
      fullName: user.fullName,
      passwordHash,
      role: user.role,
    }

    if (user.section) {
      const section = sectionsMap[user.section]
      if (section) data.sectionId = section.id
    }

    const created = await prisma.user.create({ data })
    console.log(`Created user: ${created.email} (${created.id})`)
  }
}
