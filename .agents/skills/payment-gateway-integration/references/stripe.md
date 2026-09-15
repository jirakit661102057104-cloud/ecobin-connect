# Stripe Integration Reference

## Install
```bash
npm i stripe @stripe/stripe-js
```

## One-time payment: Checkout Session
```ts
// server action / route handler
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: [{ price: 'price_xxx', quantity: 1 }],
  success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${origin}/pricing`,
  metadata: { userId },
});
redirect(session.url!);
```

## Subscriptions
```ts
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: 'price_monthly_xxx', quantity: 1 }],
  subscription_data: { trial_period_days: 14 },
  customer: existingStripeCustomerId, // create one first if this is the user's first purchase
  success_url, cancel_url,
});
```

## Webhook handler (Next.js route handler)
```ts
// app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillOrder(session.metadata!.userId, session); // idempotent: check if already fulfilled by event.id first
      break;
    }
    case 'invoice.payment_failed':
      await handleFailedPayment(event.data.object as Stripe.Invoice);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscriptionStatus(event.data.object as Stripe.Subscription);
      break;
  }
  return new Response('ok', { status: 200 });
}
```
Route handlers reading raw body: ensure body parsing isn't intercepted by other middleware — Stripe signature verification needs the *raw* unparsed body.

## Customer Portal (self-service billing)
```ts
const portalSession = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${origin}/settings/billing`,
});
redirect(portalSession.url);
```

## Testing
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC.
- Local webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
