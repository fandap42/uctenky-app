require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting reseed process...");

  // 1. Clear existing transactions
  const deleteResult = await prisma.transaction.deleteMany();
  console.log(`Deleted ${deleteResult.count} existing transactions.`);

  // 2. Get prerequisites
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    throw new Error("Admin user not found. Please run regular seed first.");
  }

  const sections = await prisma.section.findMany();
  if (sections.length === 0) {
    throw new Error("No sections found. Please run regular seed first.");
  }

  const expenseTypes = ['MATERIAL', 'SERVICE'];
  const statuses = ['VERIFIED', 'PURCHASED', 'APPROVED', 'VERIFIED', 'VERIFIED']; // Weighted towards verified

  const transactions = [];

  // 3. Generate 2024 and 2025 data
  for (let year = 2024; year <= 2025; year++) {
    for (let month = 0; month < 12; month++) {
      console.log(`Seeding ${year}-${month + 1}...`);
      for (let i = 1; i <= 21; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(year, month, day);
        
        const estimated = Math.floor(Math.random() * 5000) + 100;
        const final = Math.random() > 0.1 ? estimated + (Math.random() * 200 - 100) : null;
        
        const section = sections[Math.floor(Math.random() * sections.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const type = expenseTypes[Math.floor(Math.random() * expenseTypes.length)];

        transactions.push({
          requesterId: admin.id,
          sectionId: section.id,
          purpose: `Testovací nákup ${year}/${month + 1} #${i}`,
          store: i % 3 === 0 ? "Alza.cz" : i % 2 === 0 ? "Lidl" : "Papírnictví",
          estimatedAmount: estimated,
          finalAmount: final ? Math.max(0, final) : null,
          status: status,
          expenseType: type,
          dueDate: date,
          createdAt: date,
          receiptUrl: status === 'VERIFIED' || status === 'PURCHASED' ? `receipts/${year}/${String(month + 1).padStart(2, '0')}/seed-dummy-${i}.png` : null,
          note: i % 7 === 0 ? "Toto je automaticky vygenerovaná poznámka pro testování." : null,
          isPaid: status === 'VERIFIED' ? Math.random() > 0.3 : false,
          isFiled: status === 'VERIFIED' ? Math.random() > 0.5 : false,
        });
      }
    }
  }

  // 4. Batch insert
  // Note: Prisma createMany is faster for large sets
  await prisma.transaction.createMany({
    data: transactions
  });

  console.log(`Successfully seeded ${transactions.length} transactions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
