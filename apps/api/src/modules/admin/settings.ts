// Admin store settings — the white-label control surface. Editing this single
// row rebrands the storefront (name, colors, contact, social). No code change.
import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/database.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { parseOrThrow } from '../../utils/validate.ts';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query('SELECT * FROM store_settings WHERE singleton = true');
    res.json({ settings: rows[0] ?? null });
  }),
);

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color');

const settingsSchema = z.object({
  storeName: z.string().min(1).max(120),
  logoUrl: z.string().max(500).nullable().optional(),
  faviconUrl: z.string().max(500).nullable().optional(),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  currency: z.string().min(1).max(8),
  supportEmail: z.string().email().nullable().optional(),
  supportPhone: z.string().max(40).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  metaDescription: z.string().max(320).nullable().optional(),
  socialLinks: z.record(z.string(), z.string()).default({}),
  logoInvertedUrl: z.string().max(500).nullable().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxInclusive: z.boolean().default(false),
  announcementActive: z.boolean().default(false),
  announcementText: z.string().max(320).nullable().optional(),
  announcementLink: z.string().max(500).nullable().optional(),
  announcementColor: z.string().max(40).nullable().optional(),
});

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const b = parseOrThrow(settingsSchema, req.body);
    const { rows } = await query(
      `UPDATE store_settings SET
         store_name=$1, logo_url=$2, favicon_url=$3, primary_color=$4, secondary_color=$5, accent_color=$6,
         currency=$7, support_email=$8, support_phone=$9, address=$10, meta_description=$11, social_links=$12,
         logo_inverted_url=$13, tax_rate=$14, tax_inclusive=$15, announcement_active=$16, announcement_text=$17,
         announcement_link=$18, announcement_color=$19
       WHERE singleton = true RETURNING *`,
      [b.storeName, b.logoUrl ?? null, b.faviconUrl ?? null, b.primaryColor, b.secondaryColor, b.accentColor,
       b.currency, b.supportEmail ?? null, b.supportPhone ?? null, b.address ?? null, b.metaDescription ?? null,
       JSON.stringify(b.socialLinks), b.logoInvertedUrl ?? null, b.taxRate, b.taxInclusive, b.announcementActive,
       b.announcementText ?? null, b.announcementLink ?? null, b.announcementColor ?? null],
    );
    res.json({ settings: rows[0] });
  }),
);

export default router;
