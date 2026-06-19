# Security model

How OursCart authenticates users, manages tokens, and where the trust boundary sits. This is a reference implementation — complete the **production checklist** at the end before deploying.

## Authentication flow

1. **Register / login** → the API verifies credentials, then issues:
   - an **access token** (JWT, 15 min) signed with `JWT_SECRET`
   - a **refresh token** (JWT, 7 days) signed with `JWT_REFRESH_SECRET`
2. Both are set as **HTTP-only cookies**:
   - `accessToken` — `Path=/`, `HttpOnly`, `SameSite=Strict`, `Secure` in production
   - `refreshToken` — `Path=/api/auth`, `HttpOnly`, `SameSite=Strict`, `Secure` in production
3. The browser sends cookies automatically (`credentials: 'include'`). **JavaScript can never read the tokens** — they are HTTP-only by design.
4. Protected routes run `authenticate` (verify JWT) before the handler. Admin routes additionally run `requireAdmin`.
5. **Refresh:** `POST /auth/refresh` verifies the refresh token, finds the matching un-revoked DB row, **revokes it, and issues a new pair** (rotation). A reused/stolen refresh token is invalidated on the next legitimate refresh.
6. **Logout** revokes the refresh token’s DB row and clears cookies.

## Token storage & lifecycle

- **Refresh tokens are stored only as bcrypt hashes** in `refresh_tokens` (with `expires_at`, `revoked_at`, `user_agent`, `ip`). A database leak does not yield usable tokens.
- Access tokens are stateless (not stored). Their short 15-min life bounds exposure.
- Password change and password reset call `revokeAllUserTokens` — every session is forced to re-authenticate.
- Password reset uses a **single-use, stateless** token: a short-lived JWT bound to a prefix of the current password hash, so the link stops working the instant the password changes (no reset-token table needed).

## What is and isn’t trusted from the client

**Never trusted from the client:**
- **Prices, totals, discounts.** Order creation re-reads live product prices from the DB, recomputes subtotal/discount/shipping/tax/total server-side, and snapshots them. The client cannot influence what it’s charged.
- **Payment status / amount.** `POST /payments/mock-checkout` accepts **only** `{ orderId }` (enforced by Zod — extra fields are ignored). The server re-reads the order total, runs the mock gateway, and is the *only* code path that can set `payment_status = 'paid'`. There is no client route to mark an order paid.
- **Roles.** Role comes from the verified JWT, never a request field. `requireAdmin` reads `req.user.role`.
- **Ownership.** Order/address/cart reads are scoped to `req.user.id` in the SQL `WHERE` clause.

**Trusted (but validated):** request bodies are parsed with **Zod** before use; shipping address, names, quantities, etc. are validated and length-bounded.

## The hard invariants (and how they’re enforced)

| # | Invariant | Enforcement |
|---|---|---|
| 1 | Secrets never reach the browser | Only `NEXT_PUBLIC_*` is bundled client-side; tokens are HTTP-only cookies; `env.ts` keeps secrets server-only |
| 2 | Payment status set server-side only | `paymentService.mockCheckout` re-reads the order in a transaction; client sends only `orderId` |
| 3 | JWT verified on every protected route | `authenticate` middleware runs before protected handlers; invalid/expired ⇒ `401` |
| 4 | Parameterized queries everywhere | All SQL uses `$1,$2…` placeholders via `pg`; zero string-interpolated SQL |
| 5 | XSS-safe rendering | React escapes by default; the only `dangerouslySetInnerHTML` is JSON-LD, serialized with `<` escaped to `<` |
| 6 | White-label = config only | Branding lives in env + the `store_settings` row; no code change to rebrand |

## Defense-in-depth controls

- **Helmet** sets CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, etc. on every response.
- **CORS** allow-lists exactly `CORS_ORIGIN` with `credentials: true`.
- **Rate limiting**: auth endpoints are capped at **5 requests / 15 min / IP** (`express-rate-limit`); a coarse global limiter backstops the rest.
- **Passwords**: bcrypt, cost factor **12** (`BCRYPT_ROUNDS`).
- **File uploads**: image MIME types only, server-randomized filenames (client filename never trusted), size capped at `MAX_FILE_SIZE`, ≤8 files.
- **Login** compares against a dummy hash for unknown emails to reduce user-enumeration timing signals; `forgot-password` always returns `200`.
- **Boot-time validation**: the API refuses to start if a secret is missing/weak or the two JWT secrets are equal.

## Verified behaviors (from live testing)

- Cookies issued with `HttpOnly; SameSite=Strict` (refresh scoped to `/api/auth`).
- 6 rapid bad logins → `429` at attempt 5.
- A `mock-checkout` request carrying `amount:1, payment_status:"paid"` had **no effect**; the recorded payment and admin revenue reflected the true server-computed total.
- Customer → `/admin/*` returns `403`; unauthenticated → protected returns `401`.

## Known advisories (npm audit) — disclosed, not hidden

This template pins reasonable versions but, like any Node project, carries transitive advisories. Run `npm audit` and review before production:

- **Next.js** is pinned to the latest patched **14.2.x**. Some newer advisories are only fixed in Next 15; evaluate a major upgrade for production.
- **nodemailer**, **node-tar**, **glob** advisories are transitive/dev-time and not on the request hot path; address with `npm audit fix` and dependency bumps as part of your release process.

## Production checklist (do before deploying)

- [ ] Replace all secrets with strong, unique values; rotate regularly.
- [ ] Serve both apps over **HTTPS** (cookies become `Secure`; `SameSite=Strict` assumes same-site web+API or adjust to your topology).
- [ ] Move uploads to **S3/CDN** (see README).
- [ ] Put the API behind a real **WAF / rate limiter** at the edge; back `express-rate-limit` with Redis for multi-instance.
- [ ] Configure real **SMTP**.
- [ ] Run `npm audit` and resolve high/critical advisories; consider Next 15.
- [ ] Add request logging/monitoring and DB backups.
- [ ] Review the CSP for your asset/domain needs.
