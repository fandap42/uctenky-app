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

  // 3. Create test users for each role
  const testUsers = [
    { email: 'vedouci.vedeni@test.com', fullName: 'Vedoucí Vedení', role: 'HEAD_VEDENI' },
    { email: 'vedouci.hr@test.com', fullName: 'Vedoucí HR', role: 'HEAD_HR' },
    { email: 'clen@test.com', fullName: 'Běžný Člen', role: 'MEMBER' },
  ];

  const testPassword = await hash('test123', 10);

  for (const userData of testUsers) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: userData.email,
          fullName: userData.fullName,
          passwordHash: testPassword,
          role: userData.role,
        },
      });
      console.log(`Created test user: ${userData.email} (${userData.role})`);
    } else {
      console.log(`User already exists: ${userData.email}`);
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
