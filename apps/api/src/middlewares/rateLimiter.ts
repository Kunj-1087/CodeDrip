// =============================================================================
// Rate limiting middleware — tiered limits for different endpoint sensitivity.
//
// Uses the default express-rate-limit in-memory store by default. For
// production deployments with multiple API instances, configure Redis via the
// REDIS_URL environment variable and swap to rate-limit-redis + redis packages.
//
// Rate limit tiers (all per IP unless otherwise noted):
//   Auth endpoints:    5 req / 15 min  (prevents credential stuffing)
//   Password reset:    3 req / 1 hour  (prevents email flooding)
//   Checkout:          5 req / 10 min  (prevents order abuse)
//   Search:           60 req / 1 min   (scrapers hit this hard)
//   Global API:     1000 req / 15 min  (coarse abuse backstop)
//
// NOTE: For multi-instance deployments, replace the in-memory store with Redis:
//   1. npm install redis rate-limit-redis
//   2. Set REDIS_URL env var
//   3. Uncomment the Redis store initialization below
// =============================================================================
import rateLimit from 'express-rate-limit';

// To enable distributed rate limiting across multiple API instances, swap the
// in-memory store for a Redis-backed store:
//
// import { createClient } from 'redis';
// import { RedisStore } from 'rate-limit-redis';
//
// const redisClient = createClient({ url: process.env.REDIS_URL });
// await redisClient.connect();
// const store = new RedisStore({
//   sendCommand: (...args) => redisClient.sendCommand(args),
// });

const baseConfig = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
};

// Auth endpoints — strict (prevents credential stuffing).
export const authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
  skipSuccessfulRequests: true, // Only count failed login/register attempts.
  keyGenerator: (req) => {
    // Rate limit by IP + email combination to prevent distributed attacks.
    const email = (req.body?.email as string)?.toLowerCase() ?? '';
    return `${req.ip}-${email}`;
  },
});

// Password reset — very strict (prevents email flooding).
export const passwordResetLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: { error: 'Too many password reset requests. Please try again in 1 hour.' },
});

// General API — loose (prevents basic abuse).
export const globalLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: { error: 'Rate limit exceeded. Slow down and try again shortly.' },
  skip: (req) => req.ip === '127.0.0.1' || req.ip === '::1',
});

// Checkout / order creation — prevent order flooding.
export const checkoutLimiter = rateLimit({
  ...baseConfig,
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: { error: 'Too many orders. Please wait before placing another.' },
});

// Search endpoint — moderate (scrapers hit this hard).
export const searchLimiter = rateLimit({
  ...baseConfig,
  windowMs: 1 * 60 * 1000,
  limit: 60,
  message: { error: 'Search rate limit exceeded. Please slow down.' },
});
