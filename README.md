# OursCart

A complete, production-shaped ecommerce platform for **consumer electronics parts** — RAM, SSDs, hard drives, and accessories. Clone it, set environment variables, run the migrations, and deploy. **Rebranding requires zero code changes** — only env vars and a single `store_settings` database row.

> Default store: **OursCart** (electronics parts). Everything brandable is data-driven.

---

## Features

**Storefront**
- Catalog with search (Postgres trigram), category/price filters, sorting, pagination
- Product pages with image gallery, variants, specs table, ratings & reviews
- Guest cart (localStorage session) that **merges into the user cart on login**
- Wishlist, address book, coupons, multi-step checkout
- **Mock payment flow** — realistic card UI, but the payment outcome is decided 100% server-side
- Dark mode, mobile-first, accessible (focus rings, ARIA, keyboard nav)
- White-label theming: brand colors load from the DB and apply as CSS variables at runtime

**Admin** (`/admin`, role-gated)
- Dashboard: KPI cards, 30-day revenue chart and status doughnut drawn with the **raw Canvas API (no chart library)**, top products, recent orders
- Products CRUD with image upload (up to 8) and variant management; soft delete
- Orders: filter by status/payment/date, update fulfillment, **CSV export**
- Customers (with lifetime value + role management), categories, coupons, store settings

**Platform**
- JWT auth (15-min access + 7-day refresh) in **HTTP-only, SameSite=Strict cookies**; refresh tokens stored hashed + rotated
- Helmet, CORS allow-list, auth rate limiting, Zod validation on every request body
- Raw SQL migrations (no ORM); parameterized queries everywhere
- Transactional order creation and payment with server-computed totals

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14.2 (App Router), TypeScript, Tailwind CSS |
| State | React Context + `useReducer` (no Redux/Zustand) |
| Backend | Node.js + Express (separate REST service), TypeScript via `tsx` |
| Database | PostgreSQL 15+ (raw SQL migrations, `pg` driver) |
| Auth | JWT (`jsonwebtoken`) + `bcrypt`, hand-rolled (no third-party auth lib) |
| Uploads | `multer` to local disk (dev); documented S3 swap path |
| Payments | Mock engine (no real gateway) |

Monorepo via npm workspaces: `apps/web` (Next.js), `apps/api` (Express), `db/` (SQL), `scripts/` (migration runner).

---

## Quick start

Prerequisites: **Node 18+** and **PostgreSQL 15+** (local install or `docker compose up -d db`).

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env          # then edit secrets (see "Environment variables")
#    apps/web reads NEXT_PUBLIC_* from .env.local (already provided for local dev)

# 3. Create the database (if not using docker compose)
createdb ourscart             # or: psql -c "CREATE DATABASE ourscart"

# 4. Run migrations + seed demo data
npm run db:reset              # DROP + recreate schema, functions, and seed

# 5. Run the two services (separate terminals)
npm run dev:api               # http://localhost:4000
npm run dev:web               # http://localhost:3000
```

Open http://localhost:3000.

**Demo logins** (password for both: `Password123!`):
- Admin — `admin@ourscart.com`
- Customer — `customer@ourscart.com`

---

## How the first admin is created

There are no hardcoded admins. A database trigger (`first_user_becomes_admin`) promotes the **very first registered user** to `admin`; everyone after is a `customer`. On a fresh, unseeded database, just register — you become the owner. The seed file also creates an explicit demo admin.

---

## How to rebrand (white-label)

No code changes. Two surfaces:

1. **Environment** — `NEXT_PUBLIC_STORE_NAME`, plus API/site URLs.
2. **`store_settings` row** — store name, logo/favicon URLs, **primary/secondary/accent colors**, currency, support email/phone, address, meta description, social links.

Edit it in the admin UI (**Admin → Settings**) or via SQL. `StoreContext` loads the row on boot and injects the brand colors as CSS variables, so the entire UI recolors instantly. See [docs/database-guide.md](docs/database-guide.md).

---

## Environment variables

Copy `.env.example` → `.env`. Every variable is documented inline there. Summary:

**Frontend (browser-exposed — `NEXT_PUBLIC_*` only):**

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Express API |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (used in SEO/canonical/sitemap) |
| `NEXT_PUBLIC_STORE_NAME` | Default store name for static metadata |

**Backend (server-only — never sent to the browser):**

| Var | Purpose |
|---|---|
| `PORT` | API port (default 4000) |
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Distinct 64+ char signing secrets |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | Token lifetimes (`15m`, `7d`) |
| `BCRYPT_ROUNDS` | bcrypt cost (12) |
| `CORS_ORIGIN` | Allowed frontend origin (must equal `NEXT_PUBLIC_SITE_URL`) |
| `UPLOAD_DIR` / `MAX_FILE_SIZE` | Local upload dir + size cap (bytes) |
| `SMTP_*` / `EMAIL_FROM` | SMTP; blank ⇒ emails are logged to the API console (mock) |

> The API validates these at boot (`apps/api/src/config/env.ts`) and **refuses to start** if a secret is missing/weak or the two JWT secrets match.

---

## Database migration order

Migrations live in `db/` and run in numeric order:

1. `db/001_schema.sql` — tables, indexes, sequences
2. `db/002_functions.sql` — functions + triggers
3. `db/003_seed.sql` — demo data (only via `--seed`)

```bash
npm run db:migrate     # 001 + 002
npm run db:seed        # 001 + 002 + 003
npm run db:reset       # DROP schema, then 001 + 002 + 003
```

Full details in [docs/database-guide.md](docs/database-guide.md).

---

## File uploads → S3 (production)

Dev stores product images on local disk via `multer` (`apps/api/src/middlewares/upload.ts`) and serves them at `/uploads`. To move to S3:

1. Add `multer-s3` + an S3 client; point the storage engine at your bucket.
2. Store the returned object URL in `product_images.url` (the rest of the app already treats it as an opaque URL).
3. Drop the `/uploads` static handler and the Next.js `/uploads` rewrite.

---

## Project layout

```
apps/web      Next.js storefront + admin (App Router, Tailwind, Context)
apps/api      Express REST API (middleware, services, route modules)
db            001_schema / 002_functions / 003_seed SQL
scripts       migrate.mjs (zero-dep migration runner)
docs          setup-guide, api-reference, database-guide, SECURITY
```

See [docs/setup-guide.md](docs/setup-guide.md) for a from-scratch walkthrough, [docs/api-reference.md](docs/api-reference.md) for every endpoint, and [docs/SECURITY.md](docs/SECURITY.md) for the auth/token model and the trust boundary.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Run each service in watch mode |
| `npm run build` | Production build of web + typecheck of api |
| `npm run db:migrate` / `db:seed` / `db:reset` | Apply migrations |
| `npm run typecheck` | API typecheck |

---

## License

Provided as a reference implementation. Replace secrets, review [docs/SECURITY.md](docs/SECURITY.md), and complete the production checklist before any real deployment.
