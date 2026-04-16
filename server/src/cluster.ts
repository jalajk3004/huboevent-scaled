import cluster from 'node:cluster';
import os from 'node:os';
import path from 'node:path';

const WORKER_COUNT = os.cpus().length;
let readyCount = 0;

// Each worker will run index.js (the Express server)
cluster.setupPrimary({
  exec: path.join(__dirname, 'index.js'),
});

console.log(`[Master ${process.pid}] Starting ${WORKER_COUNT} workers...`);

for (let i = 0; i < WORKER_COUNT; i++) {
  cluster.fork();
}

// Workers send process.send('ready') once they are listening on the port.
// The master receives that message here and tracks how many are up.
cluster.on('message', (worker, message) => {
  if (message === 'ready') {
    readyCount++;
    console.log(`[Master] Worker ${worker.id} is ready (${readyCount}/${WORKER_COUNT})`);

    if (readyCount === WORKER_COUNT) {
      console.log(`[Master] All ${WORKER_COUNT} workers are up and serving on port ${process.env.PORT ?? 5000}`);
    }
  }
});

cluster.on('exit', (worker, code, signal) => {
  if (signal) {
    // Worker was intentionally killed (e.g. during shutdown) — do not restart
    console.log(`[Master] Worker ${worker.id} was stopped (signal: ${signal})`);
  } else if (code !== 0) {
    // Worker crashed unexpectedly — restart it
    console.error(`[Master] Worker ${worker.id} crashed (exit code: ${code}) — restarting...`);
    readyCount = Math.max(0, readyCount - 1);
    cluster.fork();
  } else {
    console.log(`[Master] Worker ${worker.id} exited cleanly`);
  }
});

// When PM2 (or the OS) stops the app, this master process gets the signal.
// We forward it to every worker so they can finish their requests and exit cleanly.
const shutdown = (signal: NodeJS.Signals): void => {
  const workers = Object.values(cluster.workers ?? {});
  console.log(`[Master] ${signal} received — stopping ${workers.length} worker(s)...`);

  // Stop respawning workers that die during shutdown
  cluster.removeAllListeners('exit');

  for (const worker of workers) {
    worker?.process.kill(signal);
  }

  // If workers don't finish in 15 seconds, force quit
  setTimeout(() => {
    console.error('[Master] Workers took too long to stop — force quitting');
    process.exit(1);
  }, 15_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Master] Unhandled promise rejection:', reason);
});
