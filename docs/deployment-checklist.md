# Pre-Deployment Checklist

Run this checklist before **every** production deployment. A skipped step here
is a production incident waiting to happen.

---

## Code

- [ ] No `console.log` statements in changed files (use the structured `logger`)
- [ ] All new environment variables added to `.env.example` with inline documentation
- [ ] No hardcoded secrets, API keys, or credentials in source code
- [ ] All new API routes have Zod validation middleware applied
- [ ] All new API routes have appropriate rate limiting applied
- [ ] All SQL queries use parameterized `$1`, `$2` placeholders — never string concatenation
- [ ] No `// TODO`, `// FIXME`, or `// HACK` comments in committed code
- [ ] Frontend: all new pages/components wrapped in `<ErrorBoundary>`

## Database

- [ ] New migration file created for any schema changes (`db/NNN_description.sql`)
- [ ] Migration tested on staging database first (never run untested migrations on prod)
- [ ] Migration uses `CONCURRENTLY` for index creation to avoid table locks
- [ ] Migrations are idempotent (`IF NOT EXISTS` / `IF EXISTS` guards)
- [ ] Run `npm run db:migrate` in production after deployment

## Testing

- [ ] Auth flow works end-to-end (register → login → add to cart → checkout)
- [ ] `/health` endpoint returns `200 {"status":"healthy"}` after deployment
- [ ] Search and filtering work on the shop page
- [ ] Admin CRUD operations work (products, orders, categories)
- [ ] No TypeScript compilation errors: `npm run typecheck`
- [ ] No lint errors in changed files

## Performance

- [ ] Cache headers applied to static routes (ISR revalidate, product detail cache)
- [ ] Image optimization enabled (`next/image` usage, remote patterns configured)
- [ ] No N+1 queries introduced (check route handlers for separate product/image queries)

## Security

- [ ] CORS_ORIGIN does not contain a wildcard (`*`)
- [ ] Helmet security headers are present in API responses
- [ ] JWT secrets are ≥ 32 characters and distinct from each other
- [ ] `BCRYPT_ROUNDS` is ≥ 12 in production
- [ ] `NODE_ENV=production` is set (hides error stack traces, enables SSL)

## Rollback Plan

- [ ] Previous Docker image / Vercel deployment identified and accessible
- [ ] Know the rollback command:
      - Vercel: `vercel rollback [deployment-url]`
      - Railway: revert to previous deployment in dashboard
      - Docker: `docker compose down && docker compose -f docker-compose.prev.yml up`
- [ ] Database backup taken **before** running any migration
- [ ] Rollback procedure documented for the on-call engineer

## Monitoring

- [ ] Uptime monitor configured to hit `/ping` every 60 seconds
- [ ] Error tracking (Sentry) is configured and receiving events
- [ ] Log aggregation is working (check that structured logs reach your aggregator)
- [ ] Backup job ran successfully in the last 24 hours
