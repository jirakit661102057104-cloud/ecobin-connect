---
name: deployment-vercel-production
description: Deploy Next.js/full-stack apps to production on Vercel — environment configuration, preview deployments, custom domains, edge/serverless function considerations, and production readiness checks. Use whenever the user asks to deploy, sets up CI/CD, configures environments/env vars, or asks "is this ready for production".
---

# Production & Vercel Deployment Skill

## Environment strategy
- Three environments minimum: **Development** (local), **Preview** (auto-deployed per PR/branch on Vercel), **Production** (main branch).
- Environment variables scoped per environment in Vercel's dashboard — never share production secrets (payment keys, DB URLs) into Preview; use test/sandbox credentials for Preview so PR previews can't touch real customer data.
- Validate required env vars at build/boot time with a schema (`config/env.ts` + zod) — fail loudly at build time, not with a runtime crash in production.

## Pre-launch production readiness checklist
- [ ] All secrets in environment variables, none hardcoded or committed
- [ ] Error tracking configured (Sentry or similar) and verified to actually capture a test error
- [ ] Database connection pooling configured correctly for serverless (see note below)
- [ ] Custom domain + SSL configured, `www` vs apex redirect decided and consistent
- [ ] `robots.txt`/sitemap configured correctly (don't accidentally block indexing on production while it was fine to block on preview)
- [ ] Payment webhooks pointed at the production URL with production signing secrets (see `payment-gateway-integration` skill)
- [ ] Rate limiting / abuse protection on public API routes and auth endpoints

## Serverless/edge considerations
- **DB connections**: serverless functions can exhaust a traditional DB connection pool under load — use a pooler (Prisma Accelerate, PgBouncer, or the DB provider's serverless-aware connection mode) rather than a plain long-lived pool per invocation.
- **Cold starts**: keep serverless function bundle size lean (avoid bundling heavy unused dependencies) to minimize cold-start latency on infrequently-hit routes.
- **Edge vs Node runtime**: use the Edge runtime only for latency-sensitive, lightweight logic (auth checks, redirects, geolocation-based routing) that doesn't need full Node APIs or heavy npm packages — most business logic and DB access stays on the Node serverless runtime.

## CI/CD
- Vercel's git integration handles preview deploys automatically per PR — pair with required status checks (typecheck, lint, tests) before merge to `main` to keep production deploys safe.
- Run `next build` locally (or in CI) before assuming a deploy will succeed — type errors and dynamic-rendering issues sometimes only surface at build time, not in dev mode.

## Rollback strategy
Vercel keeps prior deployments — know how to instantly promote a previous production deployment if a bad release ships, rather than scrambling to hotfix forward under pressure.

## Anti-patterns to flag
- Production secrets available in Preview deployments
- No error tracking, meaning production bugs are only discovered via user reports
- A long-lived DB connection pool pattern copied from a traditional server into a serverless function
- Deploying straight to production with no preview/staging verification for a risky change

## Example prompt this skill should trigger on
> "Deploy this Next.js app to production on Vercel with a custom domain and make sure it's production-ready."
