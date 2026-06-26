-- =============================================================================
-- CodeDrip — 001_schema.sql
-- Core relational schema for an electronics-parts ecommerce platform.
-- Run order: 001_schema.sql -> 002_functions.sql -> 003_seed.sql
--
-- Conventions:
--   * UUID primary keys via gen_random_uuid() (pgcrypto).
--   * Money is NUMERIC(12,2). Never use floats for money.
--   * Soft deletes (deleted_at) on products and orders only — everything else
--     is hard-deleted or deactivated via is_active flags.
--   * Tables are declared in dependency order so every REFERENCES target
--     already exists. (A previous build broke because `orders` referenced an
--     `addresses` table that was never created — hence the strict ordering.)
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), crypt(), gen_salt()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- trigram index for fuzzy product search

-- Sequence backing human-readable order numbers (CD-YYYY-000123).
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- -----------------------------------------------------------------------------
-- users — customers and admins. The very first user is promoted to admin by a
-- trigger (see 002), so a freshly cloned store has an owner without seeding.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           CITEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    first_name      TEXT,
    last_name       TEXT,
    role            TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- store_settings — single-row table driving white-label branding. The
-- `singleton` boolean PK is always true, so a second insert violates the PK and
-- the store can never have two settings rows. Rebranding = UPDATE this row.
-- -----------------------------------------------------------------------------
CREATE TABLE store_settings (
    singleton        BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
    id               UUID NOT NULL DEFAULT gen_random_uuid(),
    store_name       TEXT NOT NULL DEFAULT 'CodeDrip',
    logo_url         TEXT,
    favicon_url      TEXT,
    -- Brand defaults are the default warm palette: terra cotta primary, warm
    -- near-black secondary (dark hero / high-commit buttons), amber accent.
    primary_color    TEXT NOT NULL DEFAULT '#d97757',
    secondary_color  TEXT NOT NULL DEFAULT '#1a1917',
    accent_color     TEXT NOT NULL DEFAULT '#f4a942',
    currency         TEXT NOT NULL DEFAULT 'INR',
    support_email    TEXT,
    support_phone    TEXT,
    address          TEXT,
    meta_description TEXT,
    social_links     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- categories — self-referencing tree (parent_id) for nested catalog sections.
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url   TEXT,
    parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- products — soft-deletable. avg_rating/review_count are denormalized caches
-- maintained by the recalculate_product_rating() trigger so product listings
-- never have to aggregate the reviews table at read time.
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    slug              TEXT UNIQUE NOT NULL,
    description       TEXT,
    short_description TEXT,
    sku               TEXT UNIQUE,
    category_id       UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    brand             TEXT,
    base_price        NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    compare_at_price  NUMERIC(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
    stock_quantity    INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    is_featured       BOOLEAN NOT NULL DEFAULT false,
    deleted_at        TIMESTAMPTZ,
    specs             JSONB NOT NULL DEFAULT '{}'::jsonb,  -- capacity/speed/interface/form_factor/warranty
    avg_rating        NUMERIC(3,2) NOT NULL DEFAULT 0,
    review_count      INT NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    alt_text   TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE product_variants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,           -- e.g. "A4 / Daily Planner"
    sku_suffix     TEXT,
    price_modifier NUMERIC(12,2) NOT NULL DEFAULT 0,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    attributes     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE addresses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT,
    line1       TEXT NOT NULL,
    line2       TEXT,
    city        TEXT NOT NULL,
    state       TEXT,
    postal_code TEXT,
    country     TEXT NOT NULL DEFAULT 'India',
    is_default  BOOLEAN NOT NULL DEFAULT false
);

-- -----------------------------------------------------------------------------
-- cart_items — supports both logged-in (user_id) and guest (session_id) carts.
-- The CHECK guarantees at least one owner key is present so a row is never
-- orphaned from both a user and a session.
-- -----------------------------------------------------------------------------
CREATE TABLE cart_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id TEXT,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity   INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cart_items_owner_present CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE wishlist (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE coupons (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT UNIQUE NOT NULL,
    type            TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
    value           NUMERIC(12,2) NOT NULL CHECK (value >= 0),
    min_order_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_uses        INT,
    used_count      INT NOT NULL DEFAULT 0,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- orders — shipping_address is a JSONB snapshot frozen at checkout so later
-- edits to the user's address book never rewrite historical orders.
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number       TEXT UNIQUE NOT NULL,
    user_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shipping_address   JSONB NOT NULL,
    subtotal           NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping_fee       NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount         NUMERIC(12,2) NOT NULL DEFAULT 0,
    total              NUMERIC(12,2) NOT NULL DEFAULT 0,
    coupon_id          UUID REFERENCES coupons(id) ON DELETE SET NULL,
    payment_status     TEXT NOT NULL DEFAULT 'pending'
                         CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    fulfillment_status TEXT NOT NULL DEFAULT 'pending'
                         CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    notes              TEXT,
    deleted_at         TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- order_items — product_snapshot freezes name/price/sku at order time. product_id
-- is RESTRICT so an item's product cannot be hard-deleted out from under it;
-- catalog removal is done via products.deleted_at instead.
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id       UUID REFERENCES products(id) ON DELETE RESTRICT,
    variant_id       UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_snapshot JSONB NOT NULL,
    quantity         INT NOT NULL CHECK (quantity > 0),
    unit_price       NUMERIC(12,2) NOT NULL,
    total_price      NUMERIC(12,2) NOT NULL
);

CREATE TABLE payments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method           TEXT,
    amount           NUMERIC(12,2) NOT NULL,
    currency         TEXT NOT NULL DEFAULT 'INR',
    status           TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    transaction_id   TEXT,
    gateway_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating               INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title                TEXT,
    body                 TEXT,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
    is_approved          BOOLEAN NOT NULL DEFAULT true,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, user_id)
);

CREATE TABLE refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    user_agent TEXT,
    ip         TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Indexes. The UNIQUE constraints above already create indexes on users.email,
-- products.slug, categories.slug, products.sku, orders.order_number — so we only
-- add the non-unique access paths the application actually queries on.
-- -----------------------------------------------------------------------------
CREATE INDEX idx_products_category        ON products(category_id);
CREATE INDEX idx_products_featured_active ON products(is_featured) WHERE is_active AND deleted_at IS NULL;
CREATE INDEX idx_products_active          ON products(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_name_trgm       ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_orders_payment_status    ON orders(payment_status);
CREATE INDEX idx_orders_fulfillment       ON orders(fulfillment_status);
CREATE INDEX idx_orders_user              ON orders(user_id);
CREATE INDEX idx_order_items_order        ON order_items(order_id);
CREATE INDEX idx_cart_items_user          ON cart_items(user_id);
CREATE INDEX idx_cart_items_session       ON cart_items(session_id);
CREATE INDEX idx_reviews_product          ON reviews(product_id);
CREATE INDEX idx_addresses_user           ON addresses(user_id);
CREATE INDEX idx_wishlist_user            ON wishlist(user_id);
CREATE INDEX idx_refresh_tokens_user      ON refresh_tokens(user_id);
CREATE INDEX idx_product_images_product   ON product_images(product_id);
CREATE INDEX idx_product_variants_product ON product_variants(product_id);

COMMIT;
