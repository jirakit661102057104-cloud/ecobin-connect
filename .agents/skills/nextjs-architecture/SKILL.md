---
name: nextjs-architecture
description: Architect and scaffold Next.js applications (App Router) with production-grade project structure, rendering strategy, data fetching, and routing decisions. Use this whenever the user starts a new Next.js project, asks where a file/route/component should live, asks about server vs client components, asks about SSR/SSG/ISR/streaming, or is making structural decisions in a Next.js codebase. Also trigger on "how should I structure this Next.js app", "server actions", "route groups", "app router vs pages router".
---

# Next.js Architecture Skill

Use this skill to make deliberate, defensible architecture decisions in Next.js (App Router, v14+) projects instead of defaulting to ad-hoc file placement.

## When to reach for this skill
- Starting a new Next.js project or feature
- Deciding server component vs client component
- Choosing a rendering strategy (SSG / SSR / ISR / PPR / streaming)
- Structuring routes, layouts, route groups, parallel/intercepting routes
- Data fetching patterns (fetch caching, server actions, mutations)

## Default project structure
```
src/
├── app/
│   ├── (marketing)/            # route group: public pages, own layout
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── (app)/                  # route group: authenticated app shell
│   │   ├── dashboard/
│   │   └── layout.tsx
│   ├── api/                    # route handlers (only for webhooks/3rd-party callbacks)
│   ├── layout.tsx               # root layout
│   └── globals.css
├── components/
│   ├── ui/                     # primitive design-system components
│   └── features/               # feature-scoped composite components
├── lib/                        # server-only utilities, db clients, auth
├── hooks/                      # client-only hooks
├── actions/                    # server actions, grouped by domain
├── types/
└── config/                     # site config, env schema
```

## Core decision rules
1. **Default to Server Components.** Only add `"use client"` when you need interactivity (state, effects, event handlers, browser APIs) or a third-party client-only library (R3F, Framer Motion, GSAP hooks). Push the client boundary as low/leaf as possible — don't mark a whole page client just because one button needs `onClick`.
2. **Prefer Server Actions over API routes** for mutations from within the app. Reserve `app/api/*` route handlers for webhooks, third-party callbacks, or endpoints consumed by non-Next.js clients.
3. **Rendering strategy per route**, not per app:
   - Static marketing/content pages → SSG (`generateStaticParams`, no `dynamic` export) or ISR (`revalidate`)
   - Personalized/authenticated pages → SSR (`dynamic = 'force-dynamic'` or uncached fetch)
   - Long lists / dashboards with slow data → stream with `<Suspense>` + loading.tsx skeletons
4. **Colocate route-only UI** (`_components/`, prefixed with underscore to opt out of routing) inside the route folder; put anything reused across ≥2 routes in `src/components/`.
5. **Data fetching**: fetch directly in Server Components with the native `fetch` cache options (`{ cache: 'force-cache' | 'no-store', next: { revalidate, tags } }**`. Avoid client-side `useEffect` fetching for initial page data — it costs a waterfall and hurts Core Web Vitals.
6. **Environment/config validation**: validate `process.env` at startup with a zod schema in `config/env.ts`, never read `process.env.X` ad hoc across the codebase.

## Scaffolding

`scripts/scaffold-route-group.sh <name>` generates a route group's `layout.tsx` + `page.tsx` following the structure above — faster and more consistent than hand-writing boilerplate for a new marketing/app/auth section.

## Anti-patterns to flag
- `"use client"` at the top of a whole page when only a small island is interactive
- Fetching data in a client component with `useEffect` when it could be a Server Component
- Business logic inside API routes that duplicates a Server Action
- Deeply nested prop-drilling instead of composition/children pattern for Server→Client boundaries
- Barrel files (`index.ts` re-exporting everything) that break tree-shaking and slow builds at scale

## Example prompt this skill should trigger on
> "Set up a new Next.js 15 app for a SaaS dashboard with marketing pages and an authenticated app section."

Response should propose the route-group structure above, explain the server/client split, and scaffold the root + route-group layouts before writing feature code.
