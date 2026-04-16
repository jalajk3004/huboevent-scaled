import cluster from 'node:cluster';
import app from './app';
import config from './config/env';
import prisma from './services/prismaService';

const PORT = config.port;

const server = app.listen(PORT, () => {
  const workerId = cluster.worker?.id ?? 0;
  console.log(`[Worker ${workerId}] Running on port ${PORT} (${config.nodeEnv})`);

  // Tell the master this worker is ready to take requests
  if (process.send) {
    process.send('ready');
  }
});

// Stop accepting new requests, wait for ongoing ones to finish, then exit
const shutdown = (signal: string): void => {
  const workerId = cluster.worker?.id ?? 0;
  console.log(`[Worker ${workerId}] ${signal} received — shutting down...`);

  server.close(async () => {
    await prisma.$disconnect();
    console.log(`[Worker ${workerId}] Shut down cleanly`);
    process.exit(0);
  });

  // If shutdown takes more than 10 seconds, force quit
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error(`[Worker ${cluster.worker?.id ?? 0}] Unhandled promise rejection:`, reason);
});

process.on('uncaughtException', (err) => {
  console.error(`[Worker ${cluster.worker?.id ?? 0}] Uncaught exception:`, err);
  process.exit(1);
});
