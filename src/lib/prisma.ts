import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

// Decode direct connection URL from prisma+postgres API key if present
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
    console.error('Failed to parse databaseUrl from apiKey:', e);
  }
}

// Store PrismaClient and pg Pool in the global scope to prevent connection leaks
// in development (due to hot-reloads/Fast Refresh) and optimize reuse in production serverless environments.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: pg.Pool;
};

let prisma: PrismaClient;
let pool: pg.Pool;

// Connection limit optimization for serverless environments:
// Since serverless functions handle requests concurrently but individually per instance,
// a pool size of 2 is highly recommended to prevent connection exhaustion as Vercel scales.
const poolConfig = {
  connectionString,
  max: process.env.NODE_ENV === 'production' ? 2 : undefined, // Limit pool size in serverless production
};

if (process.env.NODE_ENV === 'production') {
  // In production, we also cache the instances on globalThis to optimize warm start reuse
  // and prevent duplicate instantiation if the module is loaded in different contexts.
  if (!globalForPrisma.prisma) {
    globalForPrisma.pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalForPrisma.prisma;
  pool = globalForPrisma.pool!;
} else {
  // In development, hot-reloading will re-execute this module, so we must use the global cache.
  if (!globalForPrisma.prisma) {
    globalForPrisma.pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(globalForPrisma.pool);
    globalForPrisma.prisma = new PrismaClient({ 
      adapter,
      log: ['query', 'info', 'warn', 'error']
    });
  }
  prisma = globalForPrisma.prisma;
  pool = globalForPrisma.pool!;
}

export { prisma, pool };

