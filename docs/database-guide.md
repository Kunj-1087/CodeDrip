# Database guide

PostgreSQL, raw SQL, no ORM. Migrations live in `db/` and are applied in order by `scripts/migrate.mjs`.

## Migration order

| File | Contains |
|---|---|
| `db/001_schema.sql` | Extensions (`pgcrypto`, `citext`, `pg_trgm`), all tables, indexes, the `order_number_seq` sequence |
| `db/002_functions.sql` | Functions + triggers |
| `db/003_seed.sql` | Demo data (settings, users, categories, products, coupons) |

```bash
npm run db:migrate    # 001 + 002
npm run db:seed       # 001 + 002 + 003
npm run db:reset      # DROP SCHEMA public CASCADE, then 001 + 002 + 003
```

The runner reads `DATABASE_URL` from the environment or `.env`. It uses only the `pg` driver (no migration framework), so it works anywhere Node + Postgres do.

## Tables

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Customers + admins | `email` (citext, unique), `password_hash`, `role` |
| `store_settings` | Singleton white-label row | `singleton` (PK, always true), colors, currency, contact, `social_links` (JSONB) |
| `categories` | Catalog tree | `slug` (unique), `parent_id` (self-FK) |
| `products` | Catalog | `slug`/`sku` (unique), `base_price`, `compare_at_price`, `stock_quantity`, `specs` (JSONB), `deleted_at` (soft delete), cached `avg_rating`/`review_count` |
| `product_images` | Product media | `product_id`, `url`, `is_primary`, `sort_order` |
| `product_variants` | Variants | `price_modifier`, `stock_quantity`, `attributes` (JSONB) |
| `addresses` | User address book | `user_id`, `is_default` |
| `cart_items` | Cart lines | `user_id` *or* `session_id` (CHECK), `product_id`, `variant_id`, `quantity` |
| `wishlist` | Saved products | unique `(user_id, product_id)` |
| `coupons` | Discounts | `code` (unique), `type` (percent/fixed), `value`, `min_order_value`, `max_uses`, `used_count`, `expires_at` |
| `orders` | Orders | `order_number` (unique), `shipping_address` (JSONB snapshot), money columns, `payment_status`, `fulfillment_status`, `deleted_at` |
| `order_items` | Order lines | `product_snapshot` (JSONB, frozen name/price/sku), `quantity`, `unit_price`, `total_price` |
| `payments` | Payment attempts | `order_id`, `amount`, `status`, `transaction_id`, `gateway_response` (JSONB) |
| `reviews` | Product reviews | `rating` (1–5 CHECK), `is_verified_purchase`, `is_approved`, unique `(product_id, user_id)` |
| `refresh_tokens` | Hashed refresh tokens | `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip` |

### Money & soft deletes
- All money is `NUMERIC(12,2)` (never floats). `pg` returns these as strings; the API converts at the edges.
- `products` and `orders` use `deleted_at` for soft deletion so historical orders keep their references (`order_items.product_id` is `ON DELETE RESTRICT`).

### Notable indexes
- `users.email`, `products.slug`, `categories.slug`, `products.sku`, `orders.order_number` — unique (auto-indexed)
- `idx_products_name_trgm` — **GIN trigram** on `products.name` for `ILIKE` search
- Partial indexes for featured/active products; FKs and status columns indexed for filters

## Functions & triggers (`002_functions.sql`)

| Object | Type | Behavior |
|---|---|---|
| `update_updated_at()` | trigger fn | `BEFORE UPDATE` stamps `updated_at` (on users, store_settings, categories, products, cart_items, orders) |
| `generate_order_number()` | function | Returns `OC-YYYY-000123` from `order_number_seq` (collision-free) |
| `recalculate_product_rating()` | trigger | After review insert/update/delete, recomputes `products.avg_rating` + `review_count` (approved only) |
| `decrement_stock_on_paid()` | trigger | When `orders.payment_status` flips to `paid`, decrements `products.stock_quantity` by the order’s quantities |
| `validate_coupon(code, subtotal)` | function | Returns the discount or `RAISE`s a clear error — the single source of truth for coupon math |
| `first_user_becomes_admin()` | trigger | `BEFORE INSERT` on `users`: the first-ever user is promoted to `admin` |

## Seed data (`003_seed.sql`)

- 1 `store_settings` row (OursCart defaults; INR; blue/slate/amber palette)
- 4 categories: RAM, SSD, HDD, Accessories
- 12 products (3 per category) with realistic `specs` JSONB and one placeholder image each
- 2 coupons: `WELCOME10` (10% off) and `FLAT200` (₹200 off ≥ ₹1000)
- 2 users (`admin@ourscart.com`, `customer@ourscart.com`), password `Password123!`, hashed with pgcrypto bcrypt (`crypt(..., gen_salt('bf', 12))`) — verified by Node `bcrypt.compare`

## Reset & reseed

```bash
npm run db:reset
```

This drops the `public` schema and re-applies all three files. Destructive — never run against production data.
