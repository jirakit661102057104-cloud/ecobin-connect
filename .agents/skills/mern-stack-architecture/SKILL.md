---
name: mern-stack-architecture
description: Architect full MERN/Next-stack applications end to end — deciding the boundary between Next.js (frontend + server actions/API), MongoDB/Postgres data layer, and Express/standalone API services when one is needed. Use whenever the user is starting a full-stack project, asks "should this be a separate backend or Next.js API routes", is structuring a monorepo, or asks about the overall system architecture for a MERN/JAMstack-adjacent app.
---

# MERN / Full-Stack Architecture Skill

Helps decide the right full-stack shape instead of defaulting to "add an Express server" out of habit.

## Decision: do you even need a separate Express backend?
- **No separate backend** (default for most SaaS/web apps): Next.js Server Actions + Route Handlers talking directly to the database (via an ORM) cover the vast majority of CRUD, auth, and mutation needs with less operational overhead.
- **Separate backend service justified when**: you need a long-running process (websockets/queues/cron beyond what serverless allows), the API must be consumed by multiple independent clients (mobile app + web + third parties) with its own versioned contract, or you have heavy compute that shouldn't run in the Next.js deploy target.

## Modern MERN stack (2026 defaults)
- **M**: MongoDB (Atlas) with Mongoose, or increasingly Postgres (Supabase/Neon) with Prisma/Drizzle when relational integrity matters — pick based on data shape, not habit.
- **E**: Express only when a standalone service is justified (see above); otherwise Next.js Route Handlers replace it.
- **R**: React (via Next.js App Router, not bare CRA/Vite for anything production-facing that needs SSR/SEO).
- **N**: Node.js runtime, or Next.js's own server runtime for the unified case.

## Monorepo structure (when a separate API is justified)
```
apps/
├── web/            # Next.js app
├── api/            # Express/Fastify service (if needed)
└── worker/         # background jobs, if any
packages/
├── ui/             # shared component library
├── config/         # shared eslint/ts/tailwind config
├── db/             # shared Prisma/Mongoose schema + client
└── types/          # shared TypeScript types/contracts
```
Use Turborepo or pnpm workspaces to manage the monorepo; share the DB client and types package between `web` and `api` so contracts don't drift.

## Layering within a single Next.js app (no separate backend)
```
lib/db/           # ORM client singleton, connection handling
lib/services/     # business logic, pure functions, testable independent of Next
actions/          # thin server actions calling lib/services
app/api/          # thin route handlers for webhooks only
```
Keep business logic out of route handlers/server actions directly — put it in `lib/services` so it's reusable and unit-testable without spinning up the framework.

## Anti-patterns to flag
- Standing up a full Express server "just in case" when Next.js Server Actions cover the actual requirements
- Business logic embedded directly in route handlers, untestable in isolation
- No shared types package in a monorepo — frontend and backend types drift and silently break
- Mixing MongoDB (document) modeling habits into a Postgres/relational schema (or vice versa) without adapting the data model to the engine

## Example prompt this skill should trigger on
> "I'm starting a new full-stack SaaS product — should I use MongoDB or Postgres, and do I need a separate Express API?"
