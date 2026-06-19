import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.ts';

// Gate for /admin/* routes. Must run AFTER `authenticate`, which sets req.user.
// Role is read from the verified JWT, not from any client-supplied value.
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw AppError.unauthorized();
  if (req.user.role !== 'admin') throw AppError.forbidden('Admin access required');
  next();
}
