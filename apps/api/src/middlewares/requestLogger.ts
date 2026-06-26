import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.ts';

// Lightweight access log: one structured line per request once the response is
// sent. We log req.path (NOT originalUrl) so query strings — which can carry
// reset tokens or search terms — never reach the logs, and we never touch the
// body. /health is skipped to keep uptime-probe noise out of the logs.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/health') return next();
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 10) / 10,
      ip: req.ip,
    });
  });

  next();
}
