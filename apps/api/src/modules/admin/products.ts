// =============================================================================
// Admin product management: list, create, read, update, soft-delete, restore,
// image upload (local disk), and variant CRUD. Mounted behind authenticate +
// requireAdmin by the admin index router.
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { AppError } from '../../utils/AppError.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';
import { uploadImages } from '../../middlewares/upload.ts';

const router = Router();

const productSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase, digits and hyphens'),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  sku: z.string().max(60).optional(),
  categoryId: z.string().uuid(),
  brand: z.string().max(120).optional(),
  basePrice: z.number().nonnegative(),
  compareAtPrice: z.number().nonnegative().nullable().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  specs: z.record(z.string(), z.unknown()).default({}),
});

// List for the admin table: includes inactive products, excludes soft-deleted.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parseOrThrow(
      z.object({
        search: z.string().max(120).optional(),
        category: z.string().uuid().optional(),
        sort: z.enum(['newest', 'price_asc', 'price_desc', 'stock_asc', 'name']).default('newest'),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      }),
      req.query,
    );

    const where: string[] = ['p.deleted_at IS NULL'];
    const params: unknown[] = [];
    if (q.search) {
      params.push(`%${q.search}%`);
      where.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
    }
    if (q.category) {
      params.push(q.category);
      where.push(`p.category_id = $${params.length}`);
    }
    const sortSql = {
      newest: 'p.created_at DESC',
      price_asc: 'p.base_price ASC',
      price_desc: 'p.base_price DESC',
      stock_asc: 'p.stock_quantity ASC',
      name: 'p.name ASC',
    }[q.sort];

    const whereSql = where.join(' AND ');
    const { rows: countRows } = await query<{ total: string }>(
      `SELECT count(*) total FROM products p WHERE ${whereSql}`,
      params,
    );
    params.push(q.limit, (q.page - 1) * q.limit);
    const { rows } = await query(
      `SELECT p.id, p.name, p.slug, p.sku, p.base_price, p.stock_quantity, p.is_active, p.is_featured,
              c.name AS category_name
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE ${whereSql} ORDER BY ${sortSql} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({
      products: rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        sku: r.sku,
        basePrice: Number(r.base_price),
        stockQuantity: r.stock_quantity,
        isActive: r.is_active,
        isFeatured: r.is_featured,
        categoryName: r.category_name,
      })),
      pagination: {
        page: q.page,
        limit: q.limit,
        total: Number(countRows[0].total),
        totalPages: Math.ceil(Number(countRows[0].total) / q.limit),
      },
    });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    // Single query with LEFT JOINs to eliminate N+1 for product detail.
    const { rows } = await query<Record<string, unknown>>(
      `SELECT p.*,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                  'id', pi.id, 'url', pi.url, 'altText', pi.alt_text,
                  'sortOrder', pi.sort_order, 'isPrimary', pi.is_primary
                ) ORDER BY pi.sort_order ASC)
                FILTER (WHERE pi.id IS NOT NULL),
                '[]'
              ) AS images,
              COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                  'id', pv.id, 'name', pv.name, 'skuSuffix', pv.sku_suffix,
                  'priceModifier', pv.price_modifier, 'stockQuantity', pv.stock_quantity,
                  'attributes', pv.attributes
                ) ORDER BY pv.name ASC)
                FILTER (WHERE pv.id IS NOT NULL),
                '[]'
              ) AS variants
       FROM products p
       LEFT JOIN product_images pi ON pi.product_id = p.id
       LEFT JOIN product_variants pv ON pv.product_id = p.id
       WHERE p.id = $1
       GROUP BY p.id`,
      [req.params.id],
    );
    if (rows.length === 0) throw AppError.notFound('Product not found');
    const r = rows[0];

    const parsedImages = Array.isArray(r.images)
      ? (r.images as Array<Record<string, unknown>>).map((i) => ({
          id: i.id,
          url: i.url,
          altText: i.altText,
          sortOrder: i.sortOrder,
          isPrimary: i.isPrimary,
        }))
      : [];
    const parsedVariants = Array.isArray(r.variants)
      ? (r.variants as Array<Record<string, unknown>>).map((v) => ({
          id: v.id,
          name: v.name,
          skuSuffix: v.skuSuffix,
          priceModifier: Number(v.priceModifier),
          stockQuantity: Number(v.stockQuantity),
          attributes: v.attributes ?? {},
        }))
      : [];

    res.json({ product: r, images: parsedImages, variants: parsedVariants });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(productSchema, req.body);

    // Check slug uniqueness before inserting — two products with the same slug
    // would cause routing conflicts on the storefront.
    const { rows: slugCheck } = await query('SELECT 1 FROM products WHERE slug = $1 AND deleted_at IS NULL', [b.slug]);
    if (slugCheck.length > 0) throw AppError.conflict(`The slug "${b.slug}" is already in use by another product`);

    const { rows } = await query(
      `INSERT INTO products (name, slug, description, short_description, sku, category_id, brand,
                             base_price, compare_at_price, stock_quantity, is_active, is_featured, specs)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [b.name, b.slug, b.description ?? null, b.shortDescription ?? null, b.sku ?? null, b.categoryId, b.brand ?? null,
       b.basePrice, b.compareAtPrice ?? null, b.stockQuantity, b.isActive, b.isFeatured, JSON.stringify(b.specs)],
    );
    res.status(201).json({ id: rows[0].id });
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(productSchema, req.body);

    // Slug uniqueness check also on update — another product may have taken the slug.
    const { rows: slugCheck } = await query(
      'SELECT 1 FROM products WHERE slug = $1 AND id != $2 AND deleted_at IS NULL',
      [b.slug, req.params.id],
    );
    if (slugCheck.length > 0) throw AppError.conflict(`The slug "${b.slug}" is already in use by another product`);

    const { rowCount } = await query(
      `UPDATE products SET name=$1, slug=$2, description=$3, short_description=$4, sku=$5, category_id=$6,
                           brand=$7, base_price=$8, compare_at_price=$9, stock_quantity=$10,
                           is_active=$11, is_featured=$12, specs=$13
       WHERE id=$14 AND deleted_at IS NULL`,
      [b.name, b.slug, b.description ?? null, b.shortDescription ?? null, b.sku ?? null, b.categoryId, b.brand ?? null,
       b.basePrice, b.compareAtPrice ?? null, b.stockQuantity, b.isActive, b.isFeatured, JSON.stringify(b.specs), req.params.id],
    );
    if (rowCount === 0) throw AppError.notFound('Product not found');
    res.json({ ok: true });
  }),
);

// Soft delete — preserves order_items references (products.deleted_at).
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rowCount } = await query(
      'UPDATE products SET deleted_at = now(), is_active = false WHERE id = $1 AND deleted_at IS NULL',
      [req.params.id],
    );
    if (rowCount === 0) throw AppError.notFound('Product not found');
    res.json({ ok: true });
  }),
);

router.post(
  '/:id/restore',
  asyncHandler(async (req, res) => {
    await query('UPDATE products SET deleted_at = NULL WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  }),
);

// Image upload (up to 8). multipart/form-data, field name "images".
router.post(
  '/:id/images',
  uploadImages.array('images', 8),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) throw AppError.badRequest('No images uploaded');

    const { rows: existing } = await query<{ count: string }>(
      'SELECT count(*) FROM product_images WHERE product_id = $1',
      [req.params.id],
    );
    let order = Number(existing[0].count);

    const inserted = [];
    for (const file of files) {
      const isPrimary = order === 0; // first image overall becomes primary
      const { rows } = await query(
        `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, url`,
        [req.params.id, `/uploads/${file.filename}`, null, order, isPrimary],
      );
      inserted.push(rows[0]);
      order += 1;
    }
    res.status(201).json({ images: inserted });
  }),
);

router.delete(
  '/:id/images/:imageId',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM product_images WHERE id = $1 AND product_id = $2', [req.params.imageId, req.params.id]);
    res.json({ ok: true });
  }),
);

// --- variants ---
const variantSchema = z.object({
  name: z.string().min(1).max(120),
  skuSuffix: z.string().max(40).optional(),
  priceModifier: z.number().default(0),
  stockQuantity: z.number().int().min(0).default(0),
  attributes: z.record(z.string(), z.unknown()).default({}),
});

router.post(
  '/:id/variants',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(variantSchema, req.body);
    const { rows } = await query(
      `INSERT INTO product_variants (product_id, name, sku_suffix, price_modifier, stock_quantity, attributes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.params.id, b.name, b.skuSuffix ?? null, b.priceModifier, b.stockQuantity, JSON.stringify(b.attributes)],
    );
    res.status(201).json({ id: rows[0].id });
  }),
);

router.delete(
  '/:id/variants/:variantId',
  asyncHandler(async (req, res) => {
    await query('DELETE FROM product_variants WHERE id = $1 AND product_id = $2', [
      req.params.variantId,
      req.params.id,
    ]);
    res.json({ ok: true });
  }),
);

export default router;
