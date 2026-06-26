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
  tags?: Array<{ name: string; slug: string; color: string }>;
}

const TAGS_SUBQUERY = `COALESCE((
  SELECT json_agg(jsonb_build_object('name', pt.name, 'slug', pt.slug, 'color', pt.color))
  FROM product_tag_assignments pta
  JOIN product_tags pt ON pt.id = pta.tag_id
  WHERE pta.product_id = p.id
), '[]') AS tags`;

const VARIANTS_SUBQUERY = `COALESCE((
  SELECT json_agg(jsonb_build_object('id', pv.id, 'name', pv.name, 'skuSuffix', pv.sku_suffix, 'priceModifier', pv.price_modifier, 'stockQuantity', pv.stock_quantity, 'attributes', pv.attributes))
  FROM product_variants pv WHERE pv.product_id = p.id
), '[]') AS variants`;

const IMAGES_SUBQUERY = `COALESCE((
  SELECT json_agg(jsonb_build_object('id', pi.id, 'url', pi.url, 'altText', pi.alt_text, 'sortOrder', pi.sort_order, 'isPrimary', pi.is_primary) ORDER BY pi.is_primary DESC, pi.sort_order ASC)
  FROM product_images pi WHERE pi.product_id = p.id
), '[]') AS images`;

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
    images: Array.isArray((r as any).images) ? (r as any).images.map((i: any) => ({
      id: i.id,
      url: i.url,
      altText: i.altText,
      sortOrder: i.sortOrder,
      isPrimary: i.isPrimary,
    })) : [],
    tags: Array.isArray(r.tags) ? r.tags : [],
    variants: Array.isArray((r as any).variants) ? (r as any).variants.map((v: any) => ({
      id: v.id,
      name: v.name,
      skuSuffix: v.skuSuffix,
      priceModifier: Number(v.priceModifier),
      stockQuantity: Number(v.stockQuantity),
      attributes: v.attributes ?? {},
    })) : [],
  };
}

// Primary-image subquery reused across list endpoints.
const PRIMARY_IMAGE =
  "(SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY is_primary DESC, sort_order ASC LIMIT 1) AS image_url";

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(120).optional(),
  sort: z.enum(['featured', 'newest', 'price_asc', 'price_desc', 'rating', 'name']).default('featured'),
  featured: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});

const SORT_SQL: Record<string, string> = {
  featured: 'p.is_featured DESC, p.created_at DESC',
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
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${PRIMARY_IMAGE}, ${TAGS_SUBQUERY}, ${VARIANTS_SUBQUERY}, ${IMAGES_SUBQUERY}
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
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${PRIMARY_IMAGE}, ${TAGS_SUBQUERY}, ${VARIANTS_SUBQUERY}, ${IMAGES_SUBQUERY}
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
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug, ${PRIMARY_IMAGE}, ${TAGS_SUBQUERY}, ${VARIANTS_SUBQUERY}, ${IMAGES_SUBQUERY}
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
    const { rows } = await query<Record<string, unknown>>(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
              COALESCE((
                SELECT json_agg(jsonb_build_object(
                  'id', pi.id, 'url', pi.url, 'altText', pi.alt_text,
                  'sortOrder', pi.sort_order, 'isPrimary', pi.is_primary
                ) ORDER BY pi.is_primary DESC, pi.sort_order ASC)
                FROM product_images pi WHERE pi.product_id = p.id
              ), '[]') AS images,
              COALESCE((
                SELECT json_agg(jsonb_build_object(
                  'id', pv.id, 'name', pv.name, 'skuSuffix', pv.sku_suffix,
                  'priceModifier', pv.price_modifier, 'stockQuantity', pv.stock_quantity,
                  'attributes', pv.attributes
                ) ORDER BY pv.name ASC)
                FROM product_variants pv WHERE pv.product_id = p.id
              ), '[]') AS variants,
              COALESCE((
                SELECT json_agg(jsonb_build_object(
                  'name', pt.name, 'slug', pt.slug, 'color', pt.color
                ))
                FROM product_tag_assignments pta
                JOIN product_tags pt ON pt.id = pta.tag_id
                WHERE pta.product_id = p.id
              ), '[]') AS tags
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.slug = $1 AND p.is_active = true AND p.deleted_at IS NULL`,
      [req.params.slug],
    );
    if (rows.length === 0) throw AppError.notFound('We could not find that product');
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

    res.json({
      product: {
        id: r.id,
        name: r.name,
        slug: r.slug,
        shortDescription: ((r as any).short_description as string) ?? null,
        description: (r.description as string) ?? null,
        sku: (r.sku as string) ?? null,
        brand: (r.brand as string) ?? null,
        basePrice: Number(r.base_price),
        compareAtPrice: r.compare_at_price !== null ? Number(r.compare_at_price) : null,
        stockQuantity: Number(r.stock_quantity),
        inStock: Number(r.stock_quantity) > 0,
        isFeatured: Boolean(r.is_featured),
        specs: ((r.specs as Record<string, unknown>) ?? {}),
        avgRating: Number(r.avg_rating),
        reviewCount: Number(r.review_count),
        categoryName: (r.category_name as string) ?? null,
        categorySlug: (r.category_slug as string) ?? null,
        imageUrl: null,
        images: parsedImages,
        variants: parsedVariants,
        tags: Array.isArray(r.tags) ? (r.tags as Array<Record<string, unknown>>) : [],
      },
    });
  }),
);

export default router;
