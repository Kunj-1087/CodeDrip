// Admin coupon CRUD.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { AppError } from '../../utils/AppError.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';

const router = Router();

const couponSchema = z.object({
  code: z.string().min(1).max(40).transform((s) => s.toUpperCase()),
  type: z.enum(['percent', 'fixed']),
  value: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({
      coupons: rows.map((r) => ({
        id: r.id,
        code: r.code,
        type: r.type,
        value: Number(r.value),
        minOrderValue: Number(r.min_order_value),
        maxUses: r.max_uses,
        usedCount: r.used_count,
        expiresAt: r.expires_at,
        isActive: r.is_active,
      })),
    });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(couponSchema, req.body);
    const { rows } = await query(
      `INSERT INTO coupons (code, type, value, min_order_value, max_uses, expires_at, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [b.code, b.type, b.value, b.minOrderValue, b.maxUses ?? null, b.expiresAt ?? null, b.isActive],
    );
    res.status(201).json({ id: rows[0].id });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(couponSchema, req.body);
    const { rowCount } = await query(
      `UPDATE coupons SET code=$1, type=$2, value=$3, min_order_value=$4, max_uses=$5, expires_at=$6, is_active=$7
       WHERE id=$8`,
      [b.code, b.type, b.value, b.minOrderValue, b.maxUses ?? null, b.expiresAt ?? null, b.isActive, req.params.id],
    );
    if (rowCount === 0) throw AppError.notFound('Coupon not found');
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  }),
);

export default router;
