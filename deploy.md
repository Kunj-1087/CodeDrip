https://github.com/Kunj-1087/CodeDrip.git# Production Deployment Guide

This guide details how to build, configure, and deploy the **CodeDrip** application (Next.js frontend, Express backend, PostgreSQL database) to production.

---

## Architecture Overview

CodeDrip is configured as a monorepo using npm workspaces:
* `/apps/web` — Next.js 14 Storefront and Admin panel.
* `/apps/api` — Express REST API server.
* `/db` — PostgreSQL database migrations and schemas.

You will deploy each component separately to maximize reliability, scalability, and ease of updates.

```mermaid
graph TD
    User([User's Browser]) -->|HTTPS| NextJS[Next.js Frontend on Vercel]
    NextJS -->|Client-side API requests| Express[Express API on Railway/Render/VPS]
    Express -->|SQL Queries| Postgres[(PostgreSQL on Neon/Supabase/RDS)]
    Express -->|Static Images| S3[AWS S3 / Object Storage]
```

---

## Step 1: Database Setup (PostgreSQL)

You need a PostgreSQL database instance (version 15+). Excellent managed solutions include **Neon**, **Supabase**, **Aiven**, or **AWS RDS**.

1. **Create the Database Instance:** Create a new database cluster on your provider and copy the connection string (`DATABASE_URL`). It will look like:
   `postgresql://username:password@hostname:5432/dbname?sslmode=require`

2. **Run Migrations:** Configure your local environment variables temporarily to point to production and run:
   ```bash
   DATABASE_URL="your_production_connection_string" npm run db:migrate
   ```
   *(Note: This executes the numeric schema scripts inside `/db` in sequence to create your tables and database triggers).*

3. **Optional: Seed Demo Data:** If you want to populate the database with initial developer t-shirts and coupons, run:
   ```bash
   DATABASE_URL="your_production_connection_string" npm run db:seed
   ```

---

## Step 2: Backend API Deployment (Express)

Deploy the Express application (`/apps/api`) to a platform that supports persistent Node.js servers, such as **Railway**, **Render**, **Fly.io**, or your own **VPS (Ubuntu/Debian)**.

### Configuration on Render / Railway:
1. **Root Directory:** Set root folder configuration to `./apps/api` (or keep workspace root and use compile scripts).
2. **Build Command:**
   ```bash
   npm install && npm run build
   ```
3. **Start Command:**
   ```bash
   npm run start:api
   ```

### Production Environment Variables:

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `NODE_ENV` | Mode | `production` (enables compression, disables logs leak) |
| `PORT` | API Port | `4001` (or whichever port your provider assigns automatically) |
| `DATABASE_URL` | Postgres URI | `postgresql://...` |
| `JWT_SECRET` | Secret to sign Access Tokens | *Generate a random 64-character hash* |
| `JWT_REFRESH_SECRET` | Secret to sign Refresh Tokens | *Generate a distinct 64-character hash* |
| `ACCESS_TOKEN_EXPIRY`| Access Token Lifetime | `15m` |
| `REFRESH_TOKEN_EXPIRY`| Refresh Token Lifetime | `7d` |
| `BCRYPT_ROUNDS` | Password hashing complexity | `12` |
| `CORS_ORIGIN` | Allowed Frontend Origin | `https://your-storefront-domain.com` |
| `SITE_URL` | Public API URL | `https://api.your-domain.com` |
| `UPLOAD_DIR` | Image directory | `./uploads` |

> [!WARNING]  
> Make sure `JWT_SECRET` and `JWT_REFRESH_SECRET` are completely different, long strings. If they match, the API will fail to start for security reasons.

---

## Step 3: Frontend Deployment (Next.js)

Host the storefront frontend (`/apps/web`) on **Vercel** for optimal Next.js performance, SSR, caching, and globally distributed CDN edges.

1. **Connect Repository:** Link your GitHub repo to Vercel.
2. **Framework Preset:** Select **Next.js**.
3. **Root Directory:** Set the Root Directory parameter to `apps/web`.
4. **Environment Variables:** Define the following frontend variables:

| Variable | Purpose | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the deployed Express backend | `https://api.your-domain.com` |
| `NEXT_PUBLIC_SITE_URL` | The domain your storefront is served on | `https://your-storefront-domain.com` |
| `NEXT_PUBLIC_STORE_NAME`| Brand title for static pages & metadata | `CodeDrip` |

5. **Deploy:** Click deploy. Vercel will bundle the workspace and deploy it globally.

---

## Step 4: S3 Image Bucket Integration (Optional but highly recommended)

By default, the server stores uploaded product images on the local disk inside `/uploads`. If you deploy to ephemeral cloud platforms (like Render or Railway), files will be wiped out during redeploys. To make uploads persistent:

1. **Set Up an Object Storage Bucket:** Create a bucket using **AWS S3**, **Cloudflare R2**, or **DigitalOcean Spaces**.
2. **Swap the Multer Engine:**
   Modify [apps/api/src/middlewares/upload.ts](file:///d:/Main Projects/Ecom/apps/api/src/middlewares/upload.ts) to utilize `multer-s3` instead of `multer.diskStorage`:
   ```typescript
   import { S3Client } from '@aws-sdk/client-s3';
   import multerS3 from 'multer-s3';

   const s3 = new S3Client({ region: 'your-region' });

   const storage = multerS3({
     s3: s3,
     bucket: 'your-bucket-name',
     acl: 'public-read',
     key: function (req, file, cb) {
       cb(null, `products/${Date.now()}-${file.originalname}`);
     }
   });
   ```
3. **Set Database References:** When inserting images into the database, store the resulting public bucket URL (`https://your-bucket.s3.amazonaws.com/...`) in the `product_images.url` field.

---

## Production Security & Best Practices

1. **Admin Authorization Gate:**
   - The first user who registers on a clean database is promoted automatically to `admin` via the trigger `first_user_becomes_admin`.
   - Ensure you register immediately upon deployment to secure the admin credential, or pre-create your admin securely through SQL seeds.
2. **Enable SSL/HTTPS:** Ensure both your API backend and your frontend use SSL (HTTPS). Secure HTTP-only auth cookies will only travel correctly over secure origins.
3. **Review CORs Settings:** Never leave `CORS_ORIGIN` blank or set to `*`. Ensure it explicitly matches the URL of your Vercel deployment storefront.
