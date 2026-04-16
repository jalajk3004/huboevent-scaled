/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: 'hubo-events-api',

      // ── Entry point ────────────────────────────────────────────────────────
      // PM2 runs the cluster master (cluster.js), which in turn forks workers
      // via Node's built-in cluster module. PM2 manages only this one process.
      script: './dist/cluster.js',

      // ── PM2 process mode ───────────────────────────────────────────────────
      // 'fork' — PM2 manages a single OS process (our master).
      // The master itself handles worker forking; PM2 does NOT do clustering.
      instances: 1,
      exec_mode: 'fork',

      // ── Crash recovery ────────────────────────────────────────────────────
      // If the master crashes, PM2 restarts it (and it re-forks all workers).
      autorestart: true,
      max_restarts: 10,
      min_uptime: '5s',
      max_memory_restart: '500M',

      // ── Graceful shutdown ──────────────────────────────────────────────────
      // PM2 sends SIGINT to the master on stop/reload.
      // The master forwards it to each worker; workers have 10s to finish.
      // kill_timeout is the hard deadline before PM2 force-kills the master.
      kill_timeout: 20000,

      // ── Logging ───────────────────────────────────────────────────────────
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ── Source maps ────────────────────────────────────────────────────────
      source_map_support: true,

      // ── Environment ────────────────────────────────────────────────────────
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
