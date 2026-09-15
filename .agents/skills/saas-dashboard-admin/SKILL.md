---
name: saas-dashboard-admin
description: Design and build SaaS dashboards and admin panels — data tables, filters, metrics/KPI cards, navigation shells, and role-scoped admin views. Use whenever the user builds a dashboard, admin panel, analytics view, internal tool, or asks about data table/filtering UX.
---

# SaaS Dashboard & Admin Panel Skill

## App shell structure
```
(app)/
├── layout.tsx          # persistent sidebar + topbar
├── dashboard/page.tsx  # overview: KPI cards + recent activity
├── [resource]/
│   ├── page.tsx         # list view (data table)
│   └── [id]/page.tsx    # detail/edit view
└── settings/
```
Sidebar nav collapses to icons-only or a drawer below `lg`; persist collapsed/expanded state client-side. Topbar carries search, notifications, and the user/org switcher — not primary navigation.

## Data tables (the core admin primitive)
- Use TanStack Table (headless) + your design system's styling — don't hand-roll table logic.
- Required features by default: column sorting, column visibility toggle, pagination (cursor-based for large datasets), row selection for bulk actions, and a persistent filter bar.
- Server-side pagination/filtering/sorting once row counts exceed a few hundred — client-side table state doesn't scale past that.
- Loading state: skeleton rows matching the real row height, not a spinner that shifts layout on load.
- Empty state: explain *why* it's empty (no data yet vs. filters too narrow) and offer the obvious next action (e.g. "Create your first project").

## KPI/metric cards
- Lead with the number, then a trend indicator (▲/▼ % vs. previous period) — don't bury the number in a chart alone.
- Loading: skeleton with the correct final width/height to avoid layout shift.
- Always show the comparison period explicitly ("vs. last 30 days") — an unlabeled trend arrow is meaningless.

## Role-scoped admin views
- Gate navigation items and page access by role at the layout level (don't just hide a button — see `auth-authorization` skill for enforcement at the data layer too).
- Distinguish "admin panel" (managing the product/other users, internal ops) from the regular "app dashboard" (a customer's own data) — usually a separate route group and often a separate, more information-dense visual density (see `visual-design-language` skill's "Compact Enterprise UI" notes).

## Anti-patterns to flag
- Client-side-only pagination/filtering on datasets that will grow past a few hundred rows
- KPI cards with numbers but no time-period context
- Admin-only actions hidden in the UI but still reachable via direct API/route access
- Dashboards that load all data before rendering anything, instead of streaming in KPI cards first with `<Suspense>`

## Example prompt this skill should trigger on
> "Build an admin dashboard showing user growth, revenue KPIs, and a table of recent signups."
