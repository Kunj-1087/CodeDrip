// =============================================================================
// Express app assembly: security middleware, CORS, body/cookie parsing, static
// uploads, API routes, and the centralized error handler (registered LAST).
// =============================================================================
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'express-async-errors';
import { env } from './config/env.ts';
import routes from './routes/index.ts';
import { errorHandler } from './middlewares/errorHandler.ts';
import { globalLimiter } from './middlewares/rateLimiter.ts';

const app = express();

// req.ip honors X-Forwarded-For when behind a reverse proxy (rate limiting).
app.set('trust proxy', 1);

// Helmet sets secure response headers on everything. crossOriginResourcePolicy
// is relaxed so the Next.js origin can load uploaded product images.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS allow-list with credentials so the HTTP-only auth cookies are accepted.
// Production: ONLY origins in CORS_ORIGIN. Development: also accept any
// localhost/127.0.0.1 port, so `npm run dev:web` works even if Next picks 3001
// because 3000 is busy. Requests with no Origin (curl, same-origin) pass through.
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
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(globalLimiter);

// Serve locally-uploaded product images (dev). In prod these live in S3/CDN.
app.use('/uploads', express.static(path.resolve(process.cwd(), env.uploadDir)));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'ourscart-api' }));

app.use('/api', routes);

// 404 for unmatched API routes (returns JSON, not HTML).
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use(errorHandler);

export default app;
