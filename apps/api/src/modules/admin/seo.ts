import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';

const router = Router();

// Zod schema for global SEO settings
const globalSeoSchema = z.object({
  metaTitleTemplate: z.string().max(200).optional(),
  defaultMetaDescription: z.string().max(500).optional(),
  ogDefaultImageUrl: z.string().max(500).nullable().optional(),
  gaTrackingId: z.string().max(60).nullable().optional(),
  fbPixelId: z.string().max(60).nullable().optional(),
  searchConsoleMeta: z.string().max(300).nullable().optional(),
  robotsTxt: z.string().max(2000).nullable().optional(),
});

// Zod schema for per-page SEO updates
const pageSeoSchema = z.object({
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  ogImageUrl: z.string().max(500).nullable().optional(),
});

// GET /api/admin/seo - Fetch all global and page SEO rules
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows: globalRows } = await query('SELECT * FROM seo_settings WHERE singleton = true');
    const { rows: pageRows } = await query('SELECT * FROM page_seo ORDER BY page_slug ASC');
    
    res.json({
      global: globalRows[0] ?? null,
      pages: pageRows,
    });
  }),
);

// PATCH /api/admin/seo - Update global SEO configuration
router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(globalSeoSchema, req.body);
    
    const { rows } = await query(
      `UPDATE seo_settings SET
         meta_title_template = COALESCE($1, meta_title_template),
         default_meta_description = COALESCE($2, default_meta_description),
         og_default_image_url = COALESCE($3, og_default_image_url),
         ga_tracking_id = COALESCE($4, ga_tracking_id),
         fb_pixel_id = COALESCE($5, fb_pixel_id),
         search_console_meta = COALESCE($6, search_console_meta),
         robots_txt = COALESCE($7, robots_txt),
         updated_at = now()
       WHERE singleton = true
       RETURNING *`,
      [
        b.metaTitleTemplate ?? null,
        b.defaultMetaDescription ?? null,
        b.ogDefaultImageUrl ?? null,
        b.gaTrackingId ?? null,
        b.fbPixelId ?? null,
        b.searchConsoleMeta ?? null,
        b.robotsTxt ?? null,
      ]
    );

    res.json({ global: rows[0] });
  }),
);

// PATCH /api/admin/seo/pages/:slug - Update meta rules for a specific slug page
router.patch(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(pageSeoSchema, req.body);
    const slug = req.params.slug;

    // Check if the record already exists
    const existing = await query('SELECT 1 FROM page_seo WHERE page_slug = $1', [slug]);
    
    let resultRow;
    if (existing.rowCount && existing.rowCount > 0) {
      const { rows } = await query(
        `UPDATE page_seo SET
           meta_title = COALESCE($1, meta_title),
           meta_description = COALESCE($2, meta_description),
           og_image_url = COALESCE($3, og_image_url),
           updated_at = now()
         WHERE page_slug = $4
         RETURNING *`,
        [b.metaTitle ?? null, b.metaDescription ?? null, b.ogImageUrl ?? null, slug]
      );
      resultRow = rows[0];
    } else {
      const { rows } = await query(
        `INSERT INTO page_seo (page_slug, meta_title, meta_description, og_image_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [slug, b.metaTitle ?? null, b.metaDescription ?? null, b.ogImageUrl ?? null]
      );
      resultRow = rows[0];
    }

    res.json({ page: resultRow });
  }),
);

export default router;
