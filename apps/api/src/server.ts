// API entry point. Importing ./app validates the environment (env.ts) before
// Triggering reload to apply UPLOAD_DIR env changes.
// the server binds, so a misconfigured process exits instead of half-starting.
//
// IMPORTANT: the environment validator runs first, checking that all required
// secrets are present and strong enough before any request is served.
import { validateEnvironment } from './utils/env-check.ts';
validateEnvironment();

import app from './app.ts';
import { env } from './config/env.ts';
import { logger } from './utils/logger.ts';
import { pool } from './config/database.ts';

const server = app.listen(env.port, () => {
  logger.info('API listening', { url: `http://localhost:${env.port}`, env: env.nodeEnv });
});

// ===========================================================================
// Graceful shutdown — let in-flight requests finish before closing.
// A forced exit after 30 seconds prevents the process from hanging forever.
// ===========================================================================
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info('Shutting down', { signal });

  server.close(async () => {
    logger.info('HTTP server closed. Closing database pool...');
    await pool.end().catch((err: Error) => {
      logger.error('Error closing database pool', { message: err.message });
    });
    logger.info('Database pool closed. Exiting.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long (30 seconds).
  setTimeout(() => {
    logger.error('Could not close connections in time. Forcing shutdown.');
    process.exit(1);
  }, 30_000).unref();
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => void gracefulShutdown(signal));
}

// Last-resort safety nets — without these a rejected promise or thrown error
// outside the request cycle would crash silently. We log structured and exit so
// a process manager (pm2/systemd/k8s) can restart cleanly.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: (reason as Error)?.message ?? String(reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});
