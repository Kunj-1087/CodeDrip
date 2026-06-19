// Account profile: view, update name, and change password (auth required).
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { hashPassword, verifyPassword, revokeAllUserTokens, toPublicUser } from '../services/authService.ts';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      'SELECT id, email, first_name, last_name, role, is_verified, created_at FROM users WHERE id = $1',
      [req.user!.id],
    );
    if (rows.length === 0) throw AppError.notFound('User not found');
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

const updateSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
});

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(updateSchema, req.body);
    const { rows } = await query(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3 RETURNING id, email, first_name, last_name, role',
      [b.firstName, b.lastName, req.user!.id],
    );
    res.json({ user: toPublicUser(rows[0]) });
  }),
);

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.patch(
  '/password',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(passwordSchema, req.body);
    const { rows } = await query<{ password_hash: string }>('SELECT password_hash FROM users WHERE id = $1', [
      req.user!.id,
    ]);
    if (rows.length === 0 || !(await verifyPassword(b.currentPassword, rows[0].password_hash))) {
      throw AppError.badRequest('Your current password is incorrect');
    }
    const newHash = await hashPassword(b.newPassword);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user!.id]);
    await revokeAllUserTokens(req.user!.id); // invalidate other sessions
    res.json({ message: 'Password updated. Other sessions have been signed out.' });
  }),
);

export default router;
