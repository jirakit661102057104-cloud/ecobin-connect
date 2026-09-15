# Worked example: Stripe subscription checkout, end to end

A minimal but complete flow — 3 pricing tiers, checkout, webhook fulfillment, and a customer portal link — wired together the way `SKILL.md` and `references/stripe.md` describe. Copy the pieces you need; this isn't a drop-in package, it's a reference implementation.

## Flow
1. `app/pricing/page.tsx` — pricing tiers, each "Subscribe" button posts to a Server Action
2. `actions/create-checkout-session.ts` — Server Action creates the Stripe Checkout Session and redirects
3. `app/api/webhooks/stripe/route.ts` — verifies the webhook, fulfills the subscription (source of truth, not the redirect)
4. `actions/create-portal-session.ts` — lets a subscribed user manage/cancel via Stripe's hosted portal

See the numbered files below for the actual code. Env vars needed: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_URL`.
