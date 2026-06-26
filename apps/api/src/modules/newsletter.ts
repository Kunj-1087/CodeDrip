import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';

const router = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
});

router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    const { email } = parseOrThrow(subscribeSchema, req.body);
    
    // Check if email already exists in subscribers
    const existing = await query('SELECT 1 FROM subscribers WHERE email = $1', [email]);
    if (existing.rowCount && existing.rowCount > 0) {
      res.json({ success: true, message: 'You are already subscribed to the list.' });
      return;
    }

    await query('INSERT INTO subscribers (email) VALUES ($1)', [email]);
    res.status(201).json({ success: true, message: 'Successfully subscribed to the changelog.' });
  }),
);

export default router;
