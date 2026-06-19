import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.ts';
import { env } from '../config/env.ts';

// Centralized error responder. Maps known error shapes to clean JSON and hides
// internals for anything unexpected. MUST be registered LAST, after routes.
//
// Postgres error codes we translate to friendly client errors:
//   23505 unique_violation      -> 409
//   23503 foreign_key_violation -> 400
//   23514 check_violation       -> 400 (also raised by validate_coupon())
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details ?? undefined });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.flatten().fieldErrors });
  }

  const pgErr = err as { code?: string; detail?: string; message?: string };
  if (pgErr && typeof pgErr.code === 'string') {
    switch (pgErr.code) {
      case '23505':
        return res.status(409).json({ error: 'That record already exists.' });
      case '23503':
        return res.status(400).json({ error: 'Referenced record does not exist.' });
      case '23514':
        // check_violation — validate_coupon() raises these with useful messages.
        return res.status(400).json({ error: pgErr.message?.replace(/^.*?:\s*/, '') || 'Invalid request.' });
      default:
        break;
    }
  }

  // Unknown / programming error: log server-side, return an opaque 500.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Something went wrong on our end.',
    ...(env.isProduction ? {} : { debug: (err as Error)?.message }),
  });
}
