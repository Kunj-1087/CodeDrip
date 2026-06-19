// API entry point. Importing ./app validates the environment (env.ts) before
// the server binds, so a misconfigured process exits instead of half-starting.
import app from './app.ts';
import { env } from './config/env.ts';

const server = app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`OursCart API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

// Graceful shutdown so in-flight requests finish and the pool closes cleanly.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  });
}
