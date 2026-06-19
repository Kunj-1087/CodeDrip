// Coupon validation. The discount is computed by the validate_coupon() DB
// function so the storefront preview and the order total use identical math.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';

const router = Router();

const validateSchema = z.object({
  code: z.string().min(1).max(40),
  subtotal: z.number().nonnegative(),
});

router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { code, subtotal } = parseOrThrow(validateSchema, req.body);
    // validate_coupon RAISEs check_violation (23514) on any invalid case; the
    // errorHandler turns that into a 400 with the human-readable reason.
    const { rows } = await query<{ discount: string }>('SELECT validate_coupon($1, $2) AS discount', [code, subtotal]);
    res.json({ valid: true, code, discount: Number(rows[0].discount) });
  }),
);

export default router;
