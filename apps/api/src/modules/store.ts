// Public store settings (white-label branding). Read-only here; admins edit via
// /api/admin/settings. The frontend StoreContext loads this once on boot and
// applies the colors as CSS variables.
import { Router } from 'express';
import { query } from '../config/database.ts';
import { asyncHandler } from '../utils/asyncHandler.ts';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { rows } = await query(
      `SELECT store_name, logo_url, favicon_url, primary_color, secondary_color, accent_color,
              currency, support_email, support_phone, address, meta_description, social_links
       FROM store_settings WHERE singleton = true`,
    );
    const s = rows[0] ?? {};
    res.json({
      storeName: s.store_name ?? 'CodeDrip',
      logoUrl: s.logo_url ?? null,
      faviconUrl: s.favicon_url ?? null,
      primaryColor: s.primary_color ?? '#4F46E5',
      secondaryColor: s.secondary_color ?? '#0f172a',
      accentColor: s.accent_color ?? '#f59e0b',
      currency: s.currency ?? 'INR',
      supportEmail: s.support_email ?? null,
      supportPhone: s.support_phone ?? null,
      address: s.address ?? null,
      metaDescription: s.meta_description ?? null,
      socialLinks: s.social_links ?? {},
    });
  }),
);

export default router;
