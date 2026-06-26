// =============================================================================
// Health check endpoints used by uptime monitors and orchestrators.
//
// GET /health — detailed health status (DB connectivity, memory, uptime).
// GET /ping  — minimal liveness probe (returns "pong").
//
// Configure your uptime monitor to hit GET /ping every 60 seconds.
// Free options: UptimeRobot (uptimerobot.com), BetterUptime, Freshping.
// Set alerts to your email/WhatsApp when the endpoint fails 2 consecutive
// checks — this is the difference between knowing your site is down vs. users
// telling you.
// =============================================================================
import { Router } from 'express';
import { checkDbHealth, pool } from '../config/database.ts';

const router = Router();

router.get('/health', async (_req, res) => {
  const dbHealthy = await checkDbHealth();
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage();

  const health = {
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`,
    database: dbHealthy ? 'connected' : 'disconnected',
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    },
    node: process.version,
    environment: process.env.NODE_ENV ?? 'development',
    pool: {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    },
  };

  res.status(dbHealthy ? 200 : 503).json(health);
});

// Minimal ping endpoint for uptime monitors — returns plain text for efficiency.
router.get('/ping', (_req, res) => res.type('text/plain').send('pong'));

export default router;
