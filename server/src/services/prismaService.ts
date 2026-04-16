import { PrismaClient } from '@prisma/client';

// In cluster mode each worker gets its own PrismaClient, so the effective
// connection count is: workers × connection_limit.
// We read PRISMA_CONNECTION_LIMIT from the environment so you can tune it
// per deployment without touching code. Default: 5 per worker.
// Example for a 4-core EC2 (4 workers × 5 = 20 total connections):
//   PRISMA_CONNECTION_LIMIT=5  DATABASE_URL="postgresql://...?connection_limit=5"
//
// Alternatively, append ?connection_limit=5 directly to DATABASE_URL and
// omit the env var — Prisma reads it from the connection string too.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
