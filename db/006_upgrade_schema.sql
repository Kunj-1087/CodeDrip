-- =============================================================================
-- CodeDrip — 006_upgrade_schema.sql
-- Add missing tables and columns for Site/SEO Settings, Order Timelines,
-- Media Library uploads, Newsletter subscriptions, and Order tracking.
-- =============================================================================

BEGIN;

-- 1. Upgrade users table with avatar_url
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Upgrade store_settings table with new fields
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS logo_inverted_url TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT false;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_text TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_link TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_color TEXT;

-- 3. Upgrade orders table with tracking, email, and shipping costs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email CITEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;

-- 4. Create seo_settings table (singleton pattern)
CREATE TABLE IF NOT EXISTS seo_settings (
    singleton                BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
    id                       UUID NOT NULL DEFAULT gen_random_uuid(),
    meta_title_template      TEXT DEFAULT '{Page Title} | {Site Name}',
    default_meta_description TEXT DEFAULT 'CodeDrip — premium apparel for the tech-obsessed.',
    og_default_image_url     TEXT,
    ga_tracking_id           TEXT,
    fb_pixel_id              TEXT,
    search_console_meta      TEXT,
    robots_txt               TEXT,
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default seo settings
INSERT INTO seo_settings (singleton) VALUES (true) ON CONFLICT (singleton) DO NOTHING;

-- 5. Create page_seo table for custom per-page settings
CREATE TABLE IF NOT EXISTS page_seo (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug        TEXT UNIQUE NOT NULL,
    meta_title       TEXT,
    meta_description TEXT,
    og_image_url     TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default static pages in page_seo
INSERT INTO page_seo (page_slug, meta_title, meta_description) VALUES
('homepage', 'CodeDrip | Wear Your Code', 'Witty, clever, and uncomfortably relatable premium developer t-shirts.'),
('about', 'About CodeDrip', 'Learn more about CodeDrip and our developer-centric clothing process.'),
('contact', 'Contact / Support', 'Reach out for help with your order or general queries.'),
('faq', 'Frequently Asked Questions', 'Learn about shipping, sizing, and refunds at CodeDrip.')
ON CONFLICT (page_slug) DO NOTHING;

-- 6. Create order_timeline table for shipping tracking updates
CREATE TABLE IF NOT EXISTS order_timeline (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      TEXT NOT NULL,
    note        TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Create subscribers table for news captures
CREATE TABLE IF NOT EXISTS subscribers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email      CITEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create hero_slides table for slide editor
CREATE TABLE IF NOT EXISTS hero_slides (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url  TEXT NOT NULL,
    heading    TEXT,
    subheading TEXT,
    cta_text   TEXT,
    cta_link   TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_active  BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create media library table
CREATE TABLE IF NOT EXISTS media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url         TEXT NOT NULL,
    filename    TEXT NOT NULL,
    size        INT,
    mime_type   TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
