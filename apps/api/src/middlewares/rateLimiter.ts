import rateLimit from 'express-rate-limit';

// SECURITY: throttle credential endpoints to blunt brute-force and credential-
// stuffing. 5 attempts / 15 min per IP on login/register/forgot/reset (see
// SECURITY.md). Successful requests still count — that's intentional for auth.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait 15 minutes and try again.' },
});

// Broad limiter applied to the whole API as a coarse abuse backstop.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Slow down and try again shortly.' },
});
