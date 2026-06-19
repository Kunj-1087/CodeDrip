// Admin category CRUD.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { AppError } from '../../utils/AppError.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  imageUrl: z.string().max(500).optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
    res.json({ categories: rows });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(categorySchema, req.body);
    const { rows } = await query(
      `INSERT INTO categories (name, slug, description, image_url, parent_id, is_active, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [b.name, b.slug, b.description ?? null, b.imageUrl ?? null, b.parentId ?? null, b.isActive, b.sortOrder],
    );
    res.status(201).json({ id: rows[0].id });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(categorySchema, req.body);
    const { rowCount } = await query(
      `UPDATE categories SET name=$1, slug=$2, description=$3, image_url=$4, parent_id=$5, is_active=$6, sort_order=$7
       WHERE id=$8`,
      [b.name, b.slug, b.description ?? null, b.imageUrl ?? null, b.parentId ?? null, b.isActive, b.sortOrder, req.params.id],
    );
    if (rowCount === 0) throw AppError.notFound('Category not found');
    res.json({ ok: true });
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    // RESTRICT FK on products means a category with products cannot be deleted;
    // surface that as a clear 409 instead of a raw DB error.
    const { rows } = await query<{ count: string }>('SELECT count(*) FROM products WHERE category_id = $1', [
      req.params.id,
    ]);
    if (Number(rows[0].count) > 0) throw AppError.conflict('Move or remove products before deleting this category');
    await query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  }),
);

export default router;
