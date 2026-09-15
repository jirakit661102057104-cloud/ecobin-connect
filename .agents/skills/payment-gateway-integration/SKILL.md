---
name: payment-gateway-integration
description: Integrate product-ready payment gateways (Stripe, Razorpay, PayPal) for one-time payments and subscription/billing flows — checkout, webhooks, invoicing, and PCI-safe practices. Use whenever the user mentions payments, checkout, Stripe, Razorpay, subscriptions, billing, pricing plans, or invoicing. Always route to the correct provider reference based on the user's market (India-first businesses often need Razorpay; global SaaS typically wants Stripe).
---

# Payment Gateway Integration Skill

## Non-negotiable security rules (apply regardless of provider)
1. **Never touch raw card numbers.** Always use the provider's hosted/embedded checkout, Elements, or Checkout Sessions — card data goes directly from the browser to the provider, never through your server. This keeps you out of full PCI-DSS scope.
2. **Secret keys server-side only.** Publishable/public keys can be client-side; secret keys live in server env vars, never in client bundles.
3. **Verify webhooks with the signing secret** — never trust an unverified webhook payload as truth (an attacker could POST a fake "payment succeeded" event otherwise).
4. **Idempotency**: use idempotency keys on payment-creation requests so a network retry doesn't double-charge.
5. **Source of truth is the webhook, not the client redirect.** A successful client-side redirect after checkout is a UX signal, not proof of payment — only grant access/fulfill the order once the corresponding webhook event is verified server-side.

## Provider selection
- **Stripe** — default for global SaaS, subscriptions, usage-based billing, strongest developer experience and docs.
- **Razorpay** — default for India-first businesses (UPI, netbanking, local payment methods, INR settlement, GST-compliant invoicing).
- **PayPal** — useful as an *additional* option for buyer trust in some markets, rarely the primary rail for a new SaaS.

Load the relevant reference file based on which provider(s) the user needs:
- `references/stripe.md` — Checkout, subscriptions, webhooks, customer portal
- `references/razorpay.md` — Orders API, subscriptions, webhooks, India-specific compliance notes

## Standard flow (provider-agnostic shape)
1. User selects a plan/product → server creates a Checkout Session / Order with the provider (server-side, using secret key).
2. Redirect user to the provider's hosted checkout (or mount embedded Elements/Checkout).
3. On completion, provider redirects to a `success_url` — show a "processing" state here, **don't fulfill yet**.
4. Provider sends a webhook (`checkout.session.completed` / `payment.captured`, etc.) to your server → verify signature → fulfill the order/activate subscription → mark as fulfilled in your DB, keyed by the provider's event ID (dedupe replayed webhooks).
5. Optionally poll/confirm on the success page once the webhook-driven DB state updates, for a responsive UI.

## Subscription & billing essentials
- Store `customerId` and `subscriptionId` from the provider on your `Organization`/`User` record; treat the provider as the source of truth for plan/status, synced to your DB via webhooks (`subscription.updated`, `subscription.deleted`, `invoice.paid`, `invoice.payment_failed`).
- Handle **failed payments/dunning**: on `invoice.payment_failed`, don't hard-cancel immediately — follow the provider's retry schedule, notify the user, and downgrade access only after the grace period per your policy.
- Use the provider's **customer portal** (Stripe Billing Portal / Razorpay equivalent) for self-service plan changes/cancellation instead of building your own billing UI from scratch when possible.

## Testing
- Always build and test against the provider's test/sandbox mode and test card numbers before touching live keys.
- Test webhook handling locally with the provider's CLI forwarding tool (`stripe listen --forward-to`, Razorpay's webhook testing tool) — don't just test the happy-path redirect.

## Scaffolding & worked example

`scripts/scaffold-webhook-route.mjs <stripe|razorpay>` generates a signature-verified webhook route handler at `api/webhooks/<provider>/route.ts` — the boilerplate most integrations get wrong is exactly the signature-verification step this generates correctly by default.

`examples/stripe-subscription-checkout/` is a complete, working reference flow (pricing page → checkout → webhook fulfillment → billing portal) wired the way this skill recommends — read it alongside `references/stripe.md` when building a real subscription flow.

## Anti-patterns to flag
- Fulfilling an order purely on the client-side success redirect without webhook confirmation
- Storing card numbers or full payment details in your own database
- No webhook signature verification
- Secret key referenced in a client component or `NEXT_PUBLIC_*` env var
- Hard-cancelling a subscription on the first failed payment instead of following dunning/grace period

## Example prompt this skill should trigger on
> "Add Stripe subscription billing with a free trial and 3 pricing tiers to our SaaS app."
