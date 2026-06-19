# Setup guide — local development from scratch

This walks you from a clean machine to a running OursCart storefront + admin.

## 1. Prerequisites

- **Node.js 18+** (`node -v`)
- **PostgreSQL 15+** running locally, or Docker (`docker compose up -d db`)
- `psql` on your PATH is handy but not required (the migration runner uses the `pg` driver)

## 2. Get the code & install

```bash
git clone <your-repo> ourscart && cd ourscart
npm install            # installs all workspaces (apps/web, apps/api)
```

## 3. Create the database

Using a local Postgres:

```bash
createdb ourscart
# or:  psql -U postgres -c "CREATE DATABASE ourscart"
```

Using Docker (provisions Postgres 17 on :5432 with user/pass `postgres`):

```bash
docker compose up -d db
```

## 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

- Set `DATABASE_URL` to your database (default: `postgresql://postgres:postgres@localhost:5432/ourscart`).
- Generate two **distinct** secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # JWT_REFRESH_SECRET
```

`apps/web/.env.local` already contains the `NEXT_PUBLIC_*` values for local dev.

## 5. Run migrations + seed

```bash
npm run db:reset      # DROP + recreate schema, functions, and demo data
```

You should see `Applying db/001_schema.sql ... done` for all three files. This creates:
- 2 demo users (admin + customer), 4 categories, 12 products, 2 coupons, 1 store-settings row.

## 6. Start the services

Two terminals:

```bash
npm run dev:api       # → OursCart API listening on http://localhost:4000
npm run dev:web       # → http://localhost:3000
```

## 7. Verify

- Visit http://localhost:3000 — the homepage shows seeded featured products.
- Sign in at `/auth/login` with `admin@ourscart.com` / `Password123!`.
- Visit `/admin` — the dashboard loads KPIs and charts.
- Add a product to the cart as a guest, then sign in — the cart merges.
- Check out and pay with the mock card form — the order appears under `/orders`.

API health check: `curl http://localhost:4000/health` → `{"status":"ok"}`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| API exits immediately with an env error | A required secret is missing/weak, or `JWT_SECRET === JWT_REFRESH_SECRET`. Fix `.env`. |
| `ECONNREFUSED` on API calls | Postgres isn’t running or `DATABASE_URL` is wrong. |
| Storefront loads but no products | Migrations not seeded — run `npm run db:reset`. |
| CORS error in browser console | `CORS_ORIGIN` must equal `NEXT_PUBLIC_SITE_URL` (`http://localhost:3000`). |
| Cookies not set on login | You must call the API over the same site; in prod, serve over HTTPS (cookies are `Secure` in production). |

## Resetting demo data

```bash
npm run db:reset      # wipes and reseeds
```
