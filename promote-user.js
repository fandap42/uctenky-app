
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function promoteUser() {
  const email = 'pavlik.frantisek42@gmail.com';
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'FINANCE' },
    });
    console.log(`Successfully promoted user ${user.email} to ${user.role}`);
  } catch (error) {
    console.error('Error promoting user:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

promoteUser();
