# Production Deployment Guide — CodeDrip

This guide walks you through deploying **CodeDrip** (Next.js frontend + Express API + PostgreSQL) to production using **Vercel** and **Railway**.

---

## Architecture

```
┌──────────────┐     HTTPS      ┌──────────────────┐     SQL      ┌─────────────────┐
│   Browser    │ ──────────────▶│  Next.js on Vercel│ ───────────▶│ PostgreSQL on    │
│              │                │  (apps/web)       │             │ Railway / Neon   │
└──────────────┘                └────────┬──────────┘             └─────────────────┘
                                         │ client-side API
                                         ▼
                                ┌──────────────────┐
                                │ Express on Railway│
                                │ (apps/api)        │
                                └──────────────────┘
```

---

## Step 1: Push to GitHub

```bash
git add .
git commit -m "chore: ready for production deploy"
git push origin main
```

---

## Step 2: Deploy the Database (Railway)

1. Go to [railway.app](https://railway.app) → **New Project** → **PostgreSQL**.
2. Railway will provision a PostgreSQL instance and auto-generate a `DATABASE_URL`.
3. Copy the connection string — you'll need it for the API service.
4. *(Optional)* Run migrations locally against the production database:
   ```bash
   DATABASE_URL="your_railway_postgres_url" npm run db:migrate --workspace=apps/api
   DATABASE_URL="your_railway_postgres_url" npm run db:seed --workspace=apps/api
   ```

> **Tip:** Alternatively, use **Neon** (free tier) or **Supabase** for an external managed database if you prefer.

---

## Step 3: Deploy the API (Railway)

1. In your Railway project, click **+ New** → **GitHub Repo** → select your CodeDrip repo.
2. **Service Settings:**
   - **Root Directory:** `/apps/api`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
3. Go to the **Variables** tab and add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | *(paste from Step 2)* |
| `JWT_SECRET` | *(generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)* |
| `JWT_REFRESH_SECRET` | *(generate a DIFFERENT one)* |
| `ACCESS_TOKEN_EXPIRY` | `15m` |
| `REFRESH_TOKEN_EXPIRY` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `SITE_URL` | `https://your-app.vercel.app` |
| `UPLOAD_DIR` | `./uploads` |
| `LOG_LEVEL` | `info` |

4. Railway will generate a public URL like `https://your-api.up.railway.app`. Copy this — you'll need it for Vercel.

> **Tip:** Use Railway's "Variables" tab to reference the database URL automatically: `${{Postgres.DATABASE_URL}}`.

---

## Step 4: Deploy the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
2. **Framework Preset:** Next.js
3. **Root Directory:** `apps/web`
4. **Build Command:** (leave default — Vercel detects it)
5. **Output Directory:** `.next`
6. Go to **Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://your-api.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_STORE_NAME` | `CodeDrip` |
| `GOOGLE_SEARCH_CONSOLE_VERIFICATION` | *(optional)* |

7. Click **Deploy**.

> **Note:** The `vercel.json` in the repo root already configures security headers and a cron job for token cleanup.

---

## Step 5: Post-Deploy Verification

1. **Frontend:** Visit your Vercel URL — the storefront should load.
2. **API:** Visit `https://your-api.up.railway.app/api/health` — should return `{"status":"ok"}`.
3. **Auth:** Register a new account on the storefront — the first user automatically becomes **admin**.
4. **Images:** Upload a product image via the admin panel — confirm it persists across deploys.

---

## Environment Variable Reference

### Frontend (Vercel)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Public site URL (for SEO, emails) |
| `NEXT_PUBLIC_STORE_NAME` | ✅ | Brand name (default: CodeDrip) |
| `GOOGLE_SEARCH_CONSOLE_VERIFICATION` | ❌ | GSC meta tag content |

### Backend (Railway)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | Server port (default: 4000) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret (32+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (must differ from JWT_SECRET) |
| `ACCESS_TOKEN_EXPIRY` | ❌ | Token lifetime (default: `15m`) |
| `REFRESH_TOKEN_EXPIRY` | ❌ | Token lifetime (default: `7d`) |
| `BCRYPT_ROUNDS` | ❌ | Hash rounds (default: 12) |
| `CORS_ORIGIN` | ✅ | Frontend origin(s), comma-separated |
| `SITE_URL` | ✅ | Public API URL |
| `UPLOAD_DIR` | ❌ | Image storage path (default: `./uploads`) |
| `LOG_LEVEL` | ❌ | `error` / `warn` / `info` / `debug` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | ❌ | Email service (logs to console if blank) |
| `REDIS_URL` | ❌ | Distributed rate limiting |
| `SENTRY_DSN` | ❌ | Error tracking |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| API returns CORS errors | Ensure `CORS_ORIGIN` matches your Vercel URL exactly (no trailing slash) |
| Images disappear on redeploy | Set up S3/R2 for persistent storage (see below) |
| "JWT_SECRET must be at least 32 chars" | Generate a longer secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| Database connection refused | Verify `DATABASE_URL` is set and the database is accessible from Railway's network |
| First user is not admin | The `first_user_becomes_admin` trigger only fires on a clean database |

---

## Optional: S3 Image Storage

Railway ephemeral disks lose uploads on redeploy. To persist images:

1. Create an **AWS S3** or **Cloudflare R2** bucket.
2. Update `apps/api/src/middlewares/upload.ts` to use `multer-s3`.
3. Store the public bucket URL in the `product_images.url` database field.

---

## Optional: Custom Domain

### Vercel (Frontend)
1. Go to **Settings → Domains** in your Vercel project.
2. Add your domain (e.g., `codedrip.dev`).
3. Update DNS records as instructed by Vercel.
4. Update `NEXT_PUBLIC_SITE_URL` to `https://codedrip.dev`.
5. Update `CORS_ORIGIN` in Railway to include the new domain.

### Railway (API)
1. Go to **Settings → Networking → Public Networking**.
2. Add a custom domain (e.g., `api.codedrip.dev`).
3. Update `NEXT_PUBLIC_API_URL` in Vercel to `https://api.codedrip.dev`.
4. Update `SITE_URL` in Railway to `https://api.codedrip.dev`.

---

## Deployment Checklist

- [ ] PostgreSQL provisioned and accessible
- [ ] Database migrations applied (`npm run db:migrate`)
- [ ] API deployed to Railway with all env vars
- [ ] API health check passes (`/api/health`)
- [ ] Frontend deployed to Vercel with env vars
- [ ] CORS_ORIGIN matches Vercel URL
- [ ] First user registered (becomes admin)
- [ ] Product images upload successfully
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled on both services
