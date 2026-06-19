// =============================================================================
// Auth routes: /register /login /refresh /logout /me /forgot-password
// /reset-password. Tokens are delivered as HTTP-only cookies (INVARIANT #1/#3).
// =============================================================================
import { Router } from 'express';
import type { CookieOptions, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authLimiter } from '../middlewares/rateLimiter.ts';
import {
  hashPassword,
  verifyPassword,
  issueTokens,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  toPublicUser,
  type AuthUserRow,
} from '../services/authService.ts';
import { mergeGuestCart } from '../services/cartService.ts';
import { sendEmail, passwordResetEmail } from '../services/emailService.ts';

const router = Router();

// --- cookie helpers ----------------------------------------------------------
// SameSite=Strict + HttpOnly + Secure(in prod). The refresh cookie is scoped to
// /api/auth so it is never attached to ordinary API calls.
function baseCookie(): CookieOptions {
  return { httpOnly: true, secure: env.isProduction, sameSite: 'strict' };
}
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, { ...baseCookie(), path: '/', maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...baseCookie(), path: '/api/auth', maxAge: 7 * 24 * 60 * 60 * 1000 });
}
function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { ...baseCookie(), path: '/' });
  res.clearCookie('refreshToken', { ...baseCookie(), path: '/api/auth' });
}
function reqMeta(req: Request) {
  return { userAgent: req.headers['user-agent'], ip: req.ip };
}

// --- schemas -----------------------------------------------------------------
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  // Optional guest session whose cart should merge into the new account.
  guestSessionId: z.string().max(120).optional(),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  guestSessionId: z.string().max(120).optional(),
});
const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({ token: z.string().min(10), password: z.string().min(8) });

// --- handlers ----------------------------------------------------------------
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = parseOrThrow(registerSchema, req.body);

    const existing = await query('SELECT 1 FROM users WHERE email = $1', [body.email]);
    if (existing.rowCount && existing.rowCount > 0) throw AppError.conflict('That email is already registered');

    const passwordHash = await hashPassword(body.password);
    const { rows } = await query<AuthUserRow>(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, first_name, last_name, role`,
      [body.email, passwordHash, body.firstName, body.lastName],
    );
    const user = rows[0];

    if (body.guestSessionId) await mergeGuestCart(body.guestSessionId, user.id);

    const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role }, reqMeta(req));
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json({ user: toPublicUser(user) });
  }),
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = parseOrThrow(loginSchema, req.body);

    const { rows } = await query<AuthUserRow>(
      'SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1',
      [body.email],
    );
    const user = rows[0];

    // Compare against a dummy hash when the user is missing so timing doesn't
    // reveal whether an email exists.
    const ok = user
      ? await verifyPassword(body.password, user.password_hash)
      : await verifyPassword(body.password, '$2b$12$0000000000000000000000000000000000000000000000000000a');
    if (!user || !ok) throw AppError.unauthorized('Email or password is incorrect');

    if (body.guestSessionId) await mergeGuestCart(body.guestSessionId, user.id);

    const tokens = await issueTokens({ id: user.id, email: user.email, role: user.role }, reqMeta(req));
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user: toPublicUser(user) });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;
    if (!refreshToken) throw AppError.unauthorized('No refresh token');
    const tokens = await rotateRefreshToken(refreshToken, reqMeta(req));
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ ok: true });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;
    if (refreshToken) await revokeRefreshToken(refreshToken);
    clearAuthCookies(res);
    res.status(204).send();
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT id, email, first_name, last_name, role, is_verified, created_at FROM users WHERE id = $1',
      [req.user!.id],
    );
    if (rows.length === 0) throw AppError.notFound('User not found');
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

// Always returns 200 — never reveal whether an email is registered.
router.post(
  '/forgot-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email } = parseOrThrow(forgotSchema, req.body);
    const { rows } = await query<{ id: string; password_hash: string }>(
      'SELECT id, password_hash FROM users WHERE email = $1',
      [email],
    );
    if (rows.length > 0) {
      const user = rows[0];
      // Stateless, single-use reset token: the `v` claim is bound to the current
      // password hash, so the link stops working the moment the password changes.
      const token = jwt.sign({ purpose: 'pwreset', v: user.password_hash.slice(0, 16) }, env.jwtSecret, {
        subject: user.id,
        expiresIn: '30m',
      });
      const resetUrl = `${env.corsOrigin}/auth/reset-password?token=${encodeURIComponent(token)}`;
      const mail = passwordResetEmail(resetUrl);
      await sendEmail(email, mail.subject, mail.html, mail.text);
    }
    res.json({ message: 'If that email is registered, a reset link is on its way.' });
  }),
);

router.post(
  '/reset-password',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { token, password } = parseOrThrow(resetSchema, req.body);

    let payload: { sub: string; purpose: string; v: string };
    try {
      payload = jwt.verify(token, env.jwtSecret) as typeof payload;
    } catch {
      throw AppError.badRequest('This reset link is invalid or has expired');
    }
    if (payload.purpose !== 'pwreset') throw AppError.badRequest('Invalid reset token');

    const { rows } = await query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [
      payload.sub,
    ]);
    if (rows.length === 0 || rows[0].password_hash.slice(0, 16) !== payload.v) {
      throw AppError.badRequest('This reset link has already been used');
    }

    const newHash = await hashPassword(password);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, payload.sub]);
    await revokeAllUserTokens(payload.sub); // force re-login everywhere
    res.json({ message: 'Your password has been updated. Please sign in.' });
  }),
);

export default router;
