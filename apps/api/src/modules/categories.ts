// Public category browsing.
import { Router } from 'express';
import { query } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';

const router = Router();

function mapCategory(r: Record<string, unknown>) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    imageUrl: r.image_url,
    parentId: r.parent_id,
    sortOrder: r.sort_order,
    productCount: r.product_count !== undefined ? Number(r.product_count) : undefined,
  };
}

// List active categories with a live count of active products in each.
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT c.*,
              (SELECT count(*) FROM products p
               WHERE p.category_id = c.id AND p.is_active = true AND p.deleted_at IS NULL) AS product_count
       FROM categories c
       WHERE c.is_active = true
       ORDER BY c.sort_order ASC, c.name ASC`,
    );
    res.json({ categories: rows.map(mapCategory) });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { rows } = await query('SELECT * FROM categories WHERE slug = $1 AND is_active = true', [req.params.slug]);
    if (rows.length === 0) throw AppError.notFound('We couldn’t find that category');
    res.json({ category: mapCategory(rows[0]) });
  }),
);

export default router;
