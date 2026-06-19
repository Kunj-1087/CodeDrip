import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';
import type { AuthUser } from '../types/express.d.ts';

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin';
}

// Extract the access token from the HTTP-only cookie first (browser flow), then
// fall back to an Authorization: Bearer header (useful for API clients/tests).
function extractToken(req: Request): string | undefined {
  const cookieToken = (req.cookies as Record<string, string> | undefined)?.accessToken;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return undefined;
}

// HARD INVARIANT #3: protected routes verify the JWT before the handler runs.
// Expired or invalid tokens => 401, never a partial/anonymous handler execution.
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) throw AppError.unauthorized('Authentication required');

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
    const user: AuthUser = { id: payload.sub, email: payload.email, role: payload.role };
    req.user = user;
    next();
  } catch {
    throw AppError.unauthorized('Your session is invalid or has expired');
  }
}

// Soft variant: attaches req.user if a valid token is present, but never blocks.
// Used by cart routes that work for both guests and logged-in users.
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, env.jwtSecret) as AccessTokenPayload;
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    } catch {
      /* ignore — proceed as guest */
    }
  }
  next();
}
