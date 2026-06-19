// Address book (auth required). Setting one address default unsets the others.
import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';

const router = Router();
router.use(authenticate);

function mapAddress(r: Record<string, unknown>) {
  return {
    id: r.id,
    label: r.label,
    line1: r.line1,
    line2: r.line2,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    country: r.country,
    isDefault: r.is_default,
  };
}

const addressSchema = z.object({
  label: z.string().max(60).optional(),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default('India'),
  isDefault: z.boolean().default(false),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id ASC', [
      req.user!.id,
    ]);
    res.json({ addresses: rows.map(mapAddress) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(addressSchema, req.body);
    const row = await withTransaction(async (client) => {
      if (b.isDefault) await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user!.id]);
      const { rows } = await client.query(
        `INSERT INTO addresses (user_id, label, line1, line2, city, state, postal_code, country, is_default)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.user!.id, b.label ?? null, b.line1, b.line2 ?? null, b.city, b.state ?? null, b.postalCode ?? null, b.country, b.isDefault],
      );
      return rows[0];
    });
    res.status(201).json({ address: mapAddress(row) });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(addressSchema, req.body);
    const row = await withTransaction(async (client) => {
      if (b.isDefault)
        await client.query('UPDATE addresses SET is_default = false WHERE user_id = $1 AND id <> $2', [
          req.user!.id,
          req.params.id,
        ]);
      const { rows } = await client.query(
        `UPDATE addresses SET label=$1, line1=$2, line2=$3, city=$4, state=$5, postal_code=$6, country=$7, is_default=$8
         WHERE id = $9 AND user_id = $10 RETURNING *`,
        [b.label ?? null, b.line1, b.line2 ?? null, b.city, b.state ?? null, b.postalCode ?? null, b.country, b.isDefault, req.params.id, req.user!.id],
      );
      return rows[0];
    });
    if (!row) throw AppError.notFound('Address not found');
    res.json({ address: mapAddress(row) });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    res.json({ ok: true });
  }),
);

export default router;
