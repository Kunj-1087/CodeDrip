// =============================================================================
// Public product catalog: list (with search/filter/sort/paging), detail,
// featured, and trending. Only active, non-deleted products are exposed.
// =============================================================================
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../config/database.ts';
import { AppError } from '../utils/AppError.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';
import { parseOrThrow } from '../utils/validate.ts';

const router = Router();

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  sku: string | null;
  brand: string | null;
  base_price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  is_featured: boolean;
  specs: Record<string, unknown>;
  avg_rating: string;
  review_count: number;
  category_name?: string;
  category_slug?: string;
  image_url?: string | null;
}

function mapProduct(r: ProductRow) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    shortDescription: r.short_description,
    description: r.description,
    sku: r.sku,
    brand: r.brand,
    basePrice: Number(r.base_price),
    compareAtPrice: r.compare_at_price !== null ? Number(r.compare_at_price) : null,
    stockQuantity: r.stock_quantity,
    inStock: r.stock_quantity > 0,
    isFeatured: r.is_featured,
    specs: r.specs ?? {},
    avgRating: Number(r.avg_rating),
    reviewCount: r.review_count,
    categoryName: r.category_name ?? null,
    categorySlug: r.category_slug ?? null,
    imageUrl: r.image_url ?? null,
  };
}

// Primary-image subquery reused across list endpoints.
const PRIMARY_IMAGE =
  "(SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url";

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating', 'name']).default('newest'),
  featured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

const SORT_SQL: Record<string, string> = {
  newest: 'p.created_at DESC',
  price_asc: 'p.base_price ASC',
  price_desc: 'p.base_price DESC',
  rating: 'p.avg_rating DESC, p.review_count DESC',
  name: 'p.name ASC',
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = parseOrThrow(listQuerySchema, req.query);

    // Build a parameterized WHERE — every dynamic value is a $n placeholder.
    const where: string[] = ['p.is_active = true', 'p.deleted_at IS NULL'];
    const params: unknown[] = [];

    if (q.q) {
      params.push(`%${q.q}%`);
      where.push(`p.name ILIKE $${params.length}`); // backed by the GIN trigram index
    }
    if (q.category) {
      params.push(q.category);
      where.push(`p.category_id = (SELECT id FROM categories WHERE slug = $${params.length})`);
    }
    if (q.featured !== undefined) {
      params.push(q.featured);
      where.push(`p.is_featured = $${params.length}`);
    }
    if (q.minPrice !== undefined) {
      params.push(q.minPrice);
      where.push(`p.base_price >= $${params.length}`);
    }
    if (q.maxPrice !== undefined) {
      params.push(q.maxPrice);
      where.push(`p.base_price <= $${params.length}`);
    }

    const whereSql = where.join(' AND ');
    const offset = (q.page - 1) * q.limit;

    const { rows: countRows } = await query<{ total: string }>(
      `SELECT count(*) AS total FROM products p WHERE ${whereSql}`,
      params,
    );
    const total = Number(countRows[0].total);

    params.push(q.limit, offset);
    const { rows } = await query<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${PRIMARY_IMAGE}
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE ${whereSql}
       ORDER BY ${SORT_SQL[q.sort]}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );

    res.json({
      products: rows.map(mapProduct),
      pagination: { page: q.page, limit: q.limit, total, totalPages: Math.ceil(total / q.limit) },
    });
  }),
);

router.get(
  '/featured',
  asyncHandler(async (_req, res) => {
    const { rows } = await query<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${PRIMARY_IMAGE}
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = true AND p.deleted_at IS NULL AND p.is_featured = true
       ORDER BY p.created_at DESC LIMIT 8`,
    );
    res.json({ products: rows.map(mapProduct) });
  }),
);

// Trending = best-reviewed catalogue items; a transparent proxy for popularity
// that needs no order history to be meaningful on a fresh install.
router.get(
  '/trending',
  asyncHandler(async (_req, res) => {
    const { rows } = await query<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${PRIMARY_IMAGE}
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = true AND p.deleted_at IS NULL
       ORDER BY p.review_count DESC, p.avg_rating DESC, p.created_at DESC LIMIT 8`,
    );
    res.json({ products: rows.map(mapProduct) });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { rows } = await query<ProductRow>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.is_active = true AND p.deleted_at IS NULL`,
      [req.params.slug],
    );
    if (rows.length === 0) throw AppError.notFound('We couldn’t find that product');
    const product = mapProduct(rows[0]);

    const { rows: images } = await query(
      'SELECT id, url, alt_text, sort_order, is_primary FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, sort_order ASC',
      [product.id],
    );
    const { rows: variants } = await query(
      'SELECT id, name, sku_suffix, price_modifier, stock_quantity, attributes FROM product_variants WHERE product_id = $1 ORDER BY name ASC',
      [product.id],
    );

    res.json({
      product: {
        ...product,
        images: images.map((i) => ({
          id: i.id,
          url: i.url,
          altText: i.alt_text,
          sortOrder: i.sort_order,
          isPrimary: i.is_primary,
        })),
        variants: variants.map((v) => ({
          id: v.id,
          name: v.name,
          skuSuffix: v.sku_suffix,
          priceModifier: Number(v.price_modifier),
          stockQuantity: v.stock_quantity,
          attributes: v.attributes,
        })),
      },
    });
  }),
);

export default router;
