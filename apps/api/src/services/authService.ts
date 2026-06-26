// =============================================================================
// Auth service — password hashing, JWT issuance/verification, and refresh-token
// lifecycle (rotation + revocation). Refresh tokens are stored ONLY as bcrypt
// hashes in the DB, so a database leak does not expose usable tokens.
// =============================================================================
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { query } from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';

export interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: 'customer' | 'admin';
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'customer' | 'admin';
}

export function toPublicUser(row: {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'customer' | 'admin';
}): PublicUser {
  return { id: row.id, email: row.email, firstName: row.first_name, lastName: row.last_name, role: row.role };
}

export async function hashPassword(plain: string): Promise<string> {
  // Validate password strength BEFORE hashing — don't waste bcrypt time on
  // weak passwords. The caller should also validate, but defense in depth.
  if (plain.length < 8) throw new Error('Password must be at least 8 characters');
  if (plain.length > 72) throw new Error('Password too long (bcrypt truncates at 72 chars)');
  return bcrypt.hash(plain, env.bcryptRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  // bcrypt.compare is inherently timing-safe — it hashes the candidate and
  // compares the full hash string in constant time.
  return bcrypt.compare(plain, hash);
}

interface TokenSubject {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}

export function signAccessToken(user: TokenSubject) {
  // Access tokens carry the minimum payload: subject (user ID), email, and role.
  // Never store sensitive data (password_hash, etc.) in a JWT.
  return jwt.sign({ email: user.email, role: user.role }, env.jwtSecret, {
    subject: user.id,
    expiresIn: env.accessTokenExpiry,
    issuer: 'codedrip',
    audience: 'codedrip-client',
  } as SignOptions);
}

function signRefreshToken(user: TokenSubject) {
  // jti lets us treat each refresh token as a unique, individually-revocable
  // credential even though only its hash is persisted.
  const jti = crypto.randomUUID();
  const token = jwt.sign({ email: user.email, role: user.role, jti }, env.jwtRefreshSecret, {
    subject: user.id,
    expiresIn: env.refreshTokenExpiry,
    issuer: 'codedrip',
    audience: 'codedrip-refresh',
  } as SignOptions);
  return { token, jti };
}

function refreshExpiryDate(): Date {
  // Mirror REFRESH_TOKEN_EXPIRY (e.g. "7d") for the DB expires_at column.
  const m = env.refreshTokenExpiry.match(/^(\d+)([smhd])$/);
  const ms = m
    ? Number(m[1]) * { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2] as 's' | 'm' | 'h' | 'd']
    : 7 * 864e5;
  return new Date(Date.now() + ms);
}

/** Issue a new access+refresh pair and persist the hashed refresh token. */
export async function issueTokens(user: TokenSubject, meta: { userAgent?: string; ip?: string } = {}) {
  const accessToken = signAccessToken(user);
  const { token: refreshToken } = signRefreshToken(user);
  const tokenHash = await bcrypt.hash(refreshToken, env.bcryptRounds);

  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, tokenHash, refreshExpiryDate(), meta.userAgent ?? null, meta.ip ?? null],
  );

  return { accessToken, refreshToken };
}

/**
 * Validate + rotate a refresh token. Verifies the JWT signature, finds the
 * matching un-revoked, unexpired DB row by comparing hashes, revokes it, and
 * issues a fresh pair. Rotation means a stolen-and-used token is immediately
 * invalidated on the next legitimate refresh.
 */
export async function rotateRefreshToken(refreshToken: string, meta: { userAgent?: string; ip?: string } = {}) {
  let payload: { sub: string; email: string; role: 'customer' | 'admin' };
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as typeof payload;
  } catch {
    throw AppError.unauthorized('Invalid refresh token');
  }

  const { rows } = await query<{ id: string; token_hash: string; expires_at: string; revoked_at: string | null }>(
    `SELECT id, token_hash, expires_at, revoked_at FROM refresh_tokens
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [payload.sub],
  );

  let matched: { id: string } | undefined;
  for (const row of rows) {
    if (await bcrypt.compare(refreshToken, row.token_hash)) {
      matched = { id: row.id };
      break;
    }
  }
  if (!matched) throw AppError.unauthorized('Refresh token is no longer valid');

  await query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [matched.id]);

  const subject: TokenSubject = { id: payload.sub, email: payload.email, role: payload.role };
  return issueTokens(subject, meta);
}

/** Revoke the DB row backing a refresh token (logout). Never throws on bad input. */
export async function revokeRefreshToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { sub: string };
    const { rows } = await query<{ id: string; token_hash: string }>(
      'SELECT id, token_hash FROM refresh_tokens WHERE user_id = $1 AND revoked_at IS NULL',
      [payload.sub],
    );
    for (const row of rows) {
      if (await bcrypt.compare(refreshToken, row.token_hash)) {
        await query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [row.id]);
        break;
      }
    }
  } catch {
    /* invalid/expired token on logout — nothing to revoke */
  }
}

/** Revoke EVERY active refresh token for a user (e.g. after a password reset). */
export async function revokeAllUserTokens(userId: string) {
  await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}
