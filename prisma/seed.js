require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { hash } = require('bcryptjs');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Create Admin User
  const email = 'admin@admin.com';
  const password = 'admin';
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      fullName: 'Admin',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Created/Updated admin user: ${admin.email}`);

  // 2. Create Sections
  const sections = [
    "Vedení",
    "Finance",
    "HR",
    "PR",
    "Nevzdělávací akce",
    "Vzdělávací akce",
    "Sportovní akce",
    "Gaming",
    "Kruhové akce"
  ];

  for (const name of sections) {
    const existing = await prisma.section.findFirst({ where: { name } });
    if (!existing) {
      await prisma.section.create({
        data: { name }
      });
      console.log(`Created section: ${name}`);
    } else {
      console.log(`Section already exists: ${name}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
