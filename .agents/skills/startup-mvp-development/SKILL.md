---
name: startup-mvp-development
description: Scope and build a startup MVP with ruthless prioritization — choosing what to build first, what to fake/stub, and what stack decisions minimize time-to-validate. Use whenever the user is building an MVP, prototype, "quick version" of a product, or asks what to cut/prioritize for a first launch.
---

# Startup MVP Development Skill

## Core principle
The MVP's job is to test the riskiest assumption as cheaply as possible — not to be a smaller version of the final product. Before building anything, identify: *what is the one thing that, if false, kills this idea?* Build only enough to test that.

## Scoping framework
1. **List every feature** the "full product" would need.
2. **Tag each**: `core` (the thing being tested), `supporting` (needed for core to make sense), `nice-to-have` (defer), `fake-able` (can be manual/hardcoded for now — e.g. a Stripe payment link instead of full billing, a Google Form instead of a settings page, manual email instead of an automated notification system).
3. Build only `core` + minimal `supporting`. Aggressively fake or cut everything else — a founder manually onboarding the first 20 users by hand is a valid MVP strategy.

## Stack choices optimized for speed-to-validate
- Next.js + a managed DB (Supabase/PlanetScale/MongoDB Atlas) + a managed auth provider (Clerk/Auth.js) — don't build custom infra for an unvalidated idea.
- Deploy to Vercel — zero-config CI/CD, don't hand-roll deployment pipelines pre-validation.
- Payments: a Stripe Payment Link or Checkout (see `payment-gateway-integration` skill) rather than a full billing system, until there's proven demand.
- Skip: microservices, custom design systems, i18n, complex RBAC, extensive test coverage — all premature before product-market fit, and expensive to build for something that may pivot.

## What NOT to skip even in an MVP
- Basic error tracking (Sentry) — you need to know why early users are hitting bugs.
- Basic analytics on the core action (does the user actually complete the thing you're testing?) — without this the MVP can't tell you anything.
- Data model flexibility: don't hardcode assumptions so tightly that the first round of user feedback requires a full rewrite — but don't over-engineer for scale you don't have either.

## Sequencing
Ship the thinnest possible version of the **core loop** end-to-end (signup → core action → value delivered) before polishing any single step — a rough-but-complete loop teaches more than a beautifully polished half-loop.

## Anti-patterns to flag
- Building a custom admin panel, notification system, or design system before validating anyone wants the core product
- Over-engineering the database schema for hypothetical future scale instead of the current unknowns
- Skipping analytics/error tracking, leaving the team blind to why the MVP is or isn't working
- Treating "MVP" as an excuse for a broken core experience — the core loop itself must work well; it's the *surrounding* features that get cut

## Example prompt this skill should trigger on
> "Help me build an MVP for a marketplace idea in the next 2 weeks to test if people will actually use it."
