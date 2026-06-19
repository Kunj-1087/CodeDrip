// Wishlist (auth required). Stores product references per user.
import { Router } from 'express';
import { query } from '../config/database.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { authenticate } from '../middlewares/authenticate.ts';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { rows } = await query(
      `SELECT w.product_id, p.name, p.slug, p.base_price, p.stock_quantity,
              (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url
       FROM wishlist w JOIN products p ON p.id = w.product_id AND p.deleted_at IS NULL
       WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
      [req.user!.id],
    );
    res.json({
      items: rows.map((r) => ({
        productId: r.product_id,
        name: r.name,
        slug: r.slug,
        basePrice: Number(r.base_price),
        inStock: r.stock_quantity > 0,
        imageUrl: r.image_url,
      })),
    });
  }),
);

router.post(
  '/:productId',
  asyncHandler(async (req, res) => {
    await query(
      `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.user!.id, req.params.productId],
    );
    res.status(201).json({ ok: true });
  }),
);

router.delete(
  '/:productId',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.user!.id, req.params.productId]);
    res.json({ ok: true });
  }),
);

export default router;
