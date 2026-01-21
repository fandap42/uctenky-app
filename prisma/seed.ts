import { PrismaClient, AppRole } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { hash } from "bcryptjs"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is not set")
    process.exit(1)
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("🌱 Seeding database...")

    // Create admin user
    const adminPassword = await hash("admin123", 12)
    const admin = await prisma.user.upsert({
        where: { email: "admin@test.com" },
        update: {},
        create: {
            email: "admin@test.com",
            passwordHash: adminPassword,
            fullName: "Test Admin",
            role: AppRole.ADMIN,
        },
    })
    console.log(`✅ Created admin: ${admin.email}`)

    // Create member (clen) user
    const memberPassword = await hash("member123", 12)
    const member = await prisma.user.upsert({
        where: { email: "clen@test.com" },
        update: {},
        create: {
            email: "clen@test.com",
            passwordHash: memberPassword,
            fullName: "Test Člen",
            role: AppRole.MEMBER,
        },
    })
    console.log(`✅ Created member: ${member.email}`)

    // Create head of HR user
    const hrPassword = await hash("hr123456", 12)
    const hrHead = await prisma.user.upsert({
        where: { email: "hr@test.com" },
        update: {},
        create: {
            email: "hr@test.com",
            passwordHash: hrPassword,
            fullName: "Head of HR",
            role: AppRole.HEAD_HR,
        },
    })
    console.log(`✅ Created HR head: ${hrHead.email}`)

    console.log("\n🎉 Seeding completed!")
    console.log("\nTest credentials:")
    console.log("  Admin:  admin@test.com / admin123")
    console.log("  Member: clen@test.com / member123")
    console.log("  HR:     hr@test.com / hr123456")
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
