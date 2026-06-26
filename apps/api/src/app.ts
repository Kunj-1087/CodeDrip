// =============================================================================
// Express app assembly: security middleware, CORS, body/cookie parsing, static
// uploads, API routes, and the centralized error handler (registered LAST).
//
// SECURITY HARDENING:
//   - Helmet adds 11 security headers (CSP, HSTS, X-Frame-Options, etc.).
//   - CORS is strictly origin-limited — no wildcards in production.
//   - body-parser is capped at 1MB to prevent request-body DoS.
//   - Rate limiters are applied at the route level (auth, checkout, search).
//   - Compression is on for efficient bandwidth use.
// =============================================================================
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import 'express-async-errors';
import { env } from './config/env.ts';
import routes from './routes/index.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { requestLogger } from './middlewares/requestLogger.ts';
import { globalLimiter, authLimiter, passwordResetLimiter, checkoutLimiter, searchLimiter } from './middlewares/rateLimiter.ts';
import healthRoutes from './routes/health.ts';

const app = express();

// req.ip honors X-Forwarded-For when behind a reverse proxy (rate limiting).
app.set('trust proxy', 1);

// ===========================================================================
// Security headers — Helmet adds 11 security headers automatically.
// crossOriginResourcePolicy is relaxed for product images loaded by Next.js.
// ===========================================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", env.corsOrigin],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }),
);

// gzip/deflate compressible responses (JSON, etc.). Threshold at 1KB to skip
// tiny payloads where compression overhead is not worth it.
app.use(compression({ level: 6, threshold: 1024 }));

// Structured access log — one JSON line per request when the response finishes.
app.use(requestLogger);

// ===========================================================================
// CORS allow-list with credentials so the HTTP-only auth cookies are accepted.
// Production: ONLY origins in CORS_ORIGIN. Development: also accept any
// localhost/127.0.0.1 port, so `npm run dev:web` works even if Next picks 3001
// because 3000 is busy. Requests with no Origin (curl, same-origin) pass through.
// ===========================================================================
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const allowed =
        env.corsOrigins.includes(origin) ||
        (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
      callback(null, allowed);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
    maxAge: 600, // Cache preflight for 10 minutes.
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ===========================================================================
// Rate limiting — global limiter applies to ALL /api routes first.
// Stricter per-route limiters override for sensitive endpoints.
// ===========================================================================
app.use('/api', globalLimiter);

// Serve locally-uploaded product images (dev). In prod these live in S3/CDN.
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

// ===========================================================================
// Health / ping endpoints (NOT rate-limited so uptime monitors always reach them).
// ===========================================================================
app.use(healthRoutes);

// ===========================================================================
// API routes — rate limiters applied at the route level.
// ===========================================================================
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/orders', checkoutLimiter);
app.use('/api/products', searchLimiter);

app.use('/api', routes);

// 404 for unmatched API routes (returns JSON, not HTML).
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

export default app;
