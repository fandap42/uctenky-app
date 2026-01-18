
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['FINANCE', 'SECTION_HEAD']
        }
      }
    });

    if (users.length > 0) {
      console.log('Found elevated users:', users.map(u => ({ email: u.email, role: u.role })));
    } else {
      console.log('No users with FINANCE or SECTION_HEAD role found.');
      
      const allUsers = await prisma.user.findMany({ take: 5 });
      if (allUsers.length > 0) {
        console.log('Some existing users (MEMBER):', allUsers.map(u => u.email));
      } else {
        console.log('No users found in database.');
      }
    }
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

checkUsers();
