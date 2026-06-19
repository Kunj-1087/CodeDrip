// Product reviews. Listing is public (approved only); creating requires auth.
// is_verified_purchase is determined server-side from the user's paid orders.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';
import { authenticate } from '../middlewares/authenticate.ts';

const router = Router();

router.get(
  '/product/:productId',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT r.id, r.rating, r.title, r.body, r.is_verified_purchase, r.created_at,
              trim(concat(u.first_name, ' ', left(coalesce(u.last_name,''),1))) AS author
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [req.params.productId],
    );
    res.json({
      reviews: rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerifiedPurchase: r.is_verified_purchase,
        author: r.author || 'Verified buyer',
        createdAt: r.created_at,
      })),
    });
  }),
);

const createSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
});

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const body = parseOrThrow(createSchema, req.body);
    const userId = req.user!.id;

    // Verified purchase = user has a PAID order containing this product.
    const { rows: vp } = await query(
      `SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.payment_status = 'paid' LIMIT 1`,
      [userId, body.productId],
    );
    const verified = vp.length > 0;

    // One review per user per product: upsert so editing updates in place.
    const { rows } = await query(
      `INSERT INTO reviews (product_id, user_id, rating, title, body, is_verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (product_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, title = EXCLUDED.title, body = EXCLUDED.body,
                     is_verified_purchase = EXCLUDED.is_verified_purchase
       RETURNING id`,
      [body.productId, userId, body.rating, body.title ?? null, body.body ?? null, verified],
    );
    if (rows.length === 0) throw AppError.badRequest('Could not save your review');
    res.status(201).json({ id: rows[0].id, isVerifiedPurchase: verified });
  }),
);

export default router;
