const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')

// Load env so DATABASE_URL is available when running directly
dotenv.config()

let prisma

// If project uses Prisma driver adapters (Prisma v7+), construct client with adapter
try {
  const { PrismaClient: _PrismaClient } = require('@prisma/client')
  const AdapterPkg = require('@prisma/adapter-pg')
  const { Pool } = require('pg')

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new AdapterPkg.PrismaPg(pool)

  prisma = new _PrismaClient({ adapter })
} catch (err) {
  // Fallback to default PrismaClient if adapter package is not installed or fails
  prisma = new PrismaClient()
}

async function main() {
  const sectionNames = [
    'Vedení',
    'Finance',
    'HR',
    'PR',
    'Nevzdělávací akce',
    'Vzdělávací akce',
    'Sportovní akce',
    'Gaming',
    'Kruhové akce',
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
      email: 'admin@test.com',
      fullName: 'Admin User',
      password: 'adminpass',
      role: 'ADMIN',
    },
    {
      email: 'head.finance@test.com',
      fullName: 'Finance Head',
      password: 'headpass',
      role: 'HEAD_FINANCE',
      section: 'Finance',
    },
    {
      email: 'member@test.com',
      fullName: 'Normal User',
      password: 'memberpass',
      role: 'MEMBER',
    },
  ]

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`User already exists: ${u.email}`)
      continue
    }

    const passwordHash = bcrypt.hashSync(u.password, 10)

    const data = {
      email: u.email,
      fullName: u.fullName,
      passwordHash,
      role: u.role,
    }

    if (u.section) {
      const sec = sectionsMap[u.section]
      if (sec) data.sectionId = sec.id
    }

    const created = await prisma.user.create({ data })
    console.log(`Created user: ${created.email} (${created.id})`)
  }

  console.log('\n✅ Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
