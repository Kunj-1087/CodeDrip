# API reference

Base URL: `http://localhost:4000/api` (set by `NEXT_PUBLIC_API_URL`).

**Auth model:** access + refresh tokens are delivered as **HTTP-only cookies**. Browsers send them automatically with `credentials: 'include'`. A `Bearer` access token in the `Authorization` header also works (handy for scripts). On `401`, call `POST /auth/refresh` and retry.

**Conventions:** request/response bodies are JSON. Validation failures return `400` with `{ error, details }`. Errors are `{ error: string }`. Guest cart requests send an `X-Session-Id` header.

Legend: 🔓 public · 🔑 auth required · 🛡️ admin only.

---

## Auth — `/auth`

| Method | Path | Access | Body | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | 🔓 | `{ email, password, firstName, lastName, guestSessionId? }` | Sets cookies, returns `{ user }`. Rate-limited. |
| POST | `/auth/login` | 🔓 | `{ email, password, guestSessionId? }` | Sets cookies, merges guest cart. Rate-limited. |
| POST | `/auth/refresh` | 🔑(cookie) | — | Rotates refresh token, re-sets cookies. |
| POST | `/auth/logout` | 🔓 | — | Revokes refresh token, clears cookies. |
| GET | `/auth/me` | 🔑 | — | `{ user }`. |
| POST | `/auth/forgot-password` | 🔓 | `{ email }` | Always `200`. Emails a reset link (mock-logged in dev). |
| POST | `/auth/reset-password` | 🔓 | `{ token, password }` | Single-use token; revokes all sessions. |

## Store — `/store-settings`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/store-settings` | 🔓 | White-label settings (name, colors, currency, contact, social). |

## Categories — `/categories`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/categories` | 🔓 | Active categories + product counts. |
| GET | `/categories/:slug` | 🔓 | One category. |

## Products — `/products`

| Method | Path | Access | Query / Notes |
|---|---|---|---|
| GET | `/products` | 🔓 | `q, category, sort(newest\|price_asc\|price_desc\|rating\|name), featured, minPrice, maxPrice, page, limit`. Returns `{ products, pagination }`. |
| GET | `/products/featured` | 🔓 | Up to 8 featured. |
| GET | `/products/trending` | 🔓 | Best-reviewed. |
| GET | `/products/:slug` | 🔓 | Detail incl. `images`, `variants`. |

## Reviews — `/reviews`

| Method | Path | Access | Body |
|---|---|---|---|
| GET | `/reviews/product/:productId` | 🔓 | Approved reviews. |
| POST | `/reviews` | 🔑 | `{ productId, rating(1–5), title?, body? }`. Upsert; sets verified-purchase server-side. |

## Cart — `/cart`

Guest requests send `X-Session-Id`. Logged-in requests use the cookie.

| Method | Path | Access | Body |
|---|---|---|---|
| GET | `/cart` | 🔓/🔑 | Returns `{ items, subtotal, itemCount }`. |
| POST | `/cart/items` | 🔓/🔑 | `{ productId, quantity, variantId? }`. |
| PATCH | `/cart/items/:id` | 🔓/🔑 | `{ quantity }` (0 removes). |
| DELETE | `/cart/items/:id` | 🔓/🔑 | — |
| DELETE | `/cart` | 🔓/🔑 | Clear cart. |
| POST | `/cart/merge` | 🔑 | `{ guestSessionId }`. |

## Wishlist — `/wishlist` 🔑

| Method | Path | Notes |
|---|---|---|
| GET | `/wishlist` | Saved products. |
| POST | `/wishlist/:productId` | Add (idempotent). |
| DELETE | `/wishlist/:productId` | Remove. |

## Coupons — `/coupons`

| Method | Path | Access | Body |
|---|---|---|---|
| POST | `/coupons/validate` | 🔓 | `{ code, subtotal }` → `{ valid, discount }`. Discount computed by the DB. |

## Addresses — `/addresses` 🔑

`GET` list · `POST` create · `PATCH /:id` · `DELETE /:id`. Body: `{ label?, line1, line2?, city, state?, postalCode?, country, isDefault }`.

## Profile — `/profile` 🔑

| Method | Path | Body |
|---|---|---|
| GET | `/profile` | — |
| PATCH | `/profile` | `{ firstName, lastName }` |
| PATCH | `/profile/password` | `{ currentPassword, newPassword }` (revokes other sessions) |

## Orders — `/orders` 🔑

| Method | Path | Body / Notes |
|---|---|---|
| POST | `/orders` | `{ shippingAddress, couponCode?, notes? }`. Builds from cart; **all totals computed server-side**. |
| GET | `/orders` | Your orders. |
| GET | `/orders/:id` | Order detail (ownership enforced). |

## Payments — `/payments` 🔑

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/payments/mock-checkout` | `{ orderId }` | **Only** `orderId` is accepted. Server re-reads the total, runs the mock gateway (~95% approve), sets `payment_status`. `200`+`{success:true}` on approval, `402` on decline. |

---

## Admin — `/admin/*` 🛡️

All require a valid admin JWT (`authenticate` + `requireAdmin`). Non-admins get `403`.

**Products** `/admin/products`
- `GET` (search/category/sort/page) · `POST` · `GET /:id` · `PATCH /:id` · `DELETE /:id` (soft) · `POST /:id/restore`
- `POST /:id/images` (multipart `images`, ≤8) · `DELETE /:id/images/:imageId`
- `POST /:id/variants` · `DELETE /:id/variants/:variantId`

**Categories** `/admin/categories` — `GET` · `POST` · `PATCH /:id` · `DELETE /:id` (blocked if products exist)

**Orders** `/admin/orders`
- `GET` (`fulfillmentStatus, paymentStatus, search, from, to, page`)
- `GET /export` → CSV · `GET /:id` · `PATCH /:id` (`{ fulfillmentStatus?, paymentStatus?, notes? }`)

**Customers** `/admin/customers` — `GET` · `GET /:id` (with orders) · `PATCH /:id/role` (`{ role }`; can’t demote the last admin)

**Coupons** `/admin/coupons` — `GET` · `POST` · `PATCH /:id` · `DELETE /:id`

**Settings** `/admin/settings` — `GET` · `PATCH` (white-label fields)

**Analytics** `/admin/analytics`
- `GET /kpis` — revenue MTD, orders today, customers, low-stock
- `GET /revenue-series?days=30` — gap-filled daily revenue/orders
- `GET /top-products` — top 5 by paid revenue this month
- `GET /status-breakdown` — order counts by fulfillment status
- `GET /recent-orders` — latest 10
