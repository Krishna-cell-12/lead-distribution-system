import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

// If using Prisma Postgres with a prisma+postgres:// URL, decode the real raw postgres connection URL
if (connectionString.startsWith('prisma+postgres://')) {
  try {
    const urlObj = new URL(connectionString);
    const apiKey = urlObj.searchParams.get('api_key');
    if (apiKey) {
      const decodedJson = Buffer.from(apiKey, 'base64').toString('utf-8');
      const parsed = JSON.parse(decodedJson);
      if (parsed.databaseUrl) {
        connectionString = parsed.databaseUrl;
      }
    }
  } catch (e) {
    console.error('Failed to parse databaseUrl from prisma+postgres apiKey:', e);
  }
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing database...');
  // Clear tables in dependency-safe order (child tables first)
  await prisma.processedWebhook.deleteMany({});
  await prisma.leadAssignment.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.service.deleteMany({});

  console.log('Seeding services...');
  const services = await Promise.all([
    prisma.service.create({ data: { name: 'Web Development' } }),
    prisma.service.create({ data: { name: 'Mobile App Development' } }),
    prisma.service.create({ data: { name: 'SEO Optimization' } }),
  ]);
  console.log(`Seeded ${services.length} services:`, services.map(s => s.name));

  console.log('Seeding providers...');
  const providersData = Array.from({ length: 8 }, (_, i) => ({
    name: `Provider ${i + 1}`,
    quota: 10,
    currentMonthLeads: 0,
  }));

  const providers = [];
  for (const data of providersData) {
    const provider = await prisma.provider.create({ data });
    providers.push(provider);
  }
  console.log(`Seeded ${providers.length} providers:`, providers.map(p => p.name));
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log('Database seeding completed successfully.');
  })
  .catch(async (e) => {
    console.error('Error seeding database:', e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
