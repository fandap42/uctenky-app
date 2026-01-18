
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
  const email = 'pavlik.frantisek42@gmail.com';
  const password = 'admin'; // Temporary password, should be changed or user should use existing hash if creating from scratch with known hash
  // Since we are resetting, we need a password hash. I'll use a dummy one or if I can't import hash easily without bcryptjs/node setup in seed (it is a script).
  // I'll grab the hash from the promote-user.js context if I had it, but I don't.
  // I will make a new hash for 'password'.
  const passwordHash = await hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      fullName: 'František Pavlík',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Created/Updated admin user: ${admin.email}`);

  // 2. Create Sections
  const sections = [
    "vedení",
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
