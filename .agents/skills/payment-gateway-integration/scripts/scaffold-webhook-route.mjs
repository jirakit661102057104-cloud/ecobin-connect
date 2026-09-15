#!/usr/bin/env node
// Generates a Next.js App Router webhook route handler for Stripe or Razorpay,
// with signature verification wired in per this skill's security rules.
//
// Usage: node scaffold-webhook-route.mjs <stripe|razorpay> [--app-dir src/app]
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const provider = process.argv[2];
if (!['stripe', 'razorpay'].includes(provider)) {
  console.error('Usage: node scaffold-webhook-route.mjs <stripe|razorpay> [--app-dir src/app]');
  process.exit(1);
}
const appDirFlagIndex = process.argv.indexOf('--app-dir');
const appDir = appDirFlagIndex !== -1 ? process.argv[appDirFlagIndex + 1] : 'src/app';

const targetDir = join(appDir, 'api', 'webhooks', provider);
const targetFile = join(targetDir, 'route.ts');

if (existsSync(targetFile)) {
  console.error(`Refusing to overwrite existing ${targetFile}`);
  process.exit(1);
}

const templates = {
  stripe: `import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  // TODO: dedupe on event.id before fulfilling (idempotency)
  switch (event.type) {
    case 'checkout.session.completed':
      // TODO: fulfillOrder(...)
      break;
    case 'invoice.payment_failed':
      // TODO: handleFailedPayment(...)
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // TODO: syncSubscriptionStatus(...)
      break;
  }

  return new Response('ok', { status: 200 });
}
`,
  razorpay: `import crypto from 'node:crypto';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature')!;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (expected !== signature) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);
  // TODO: dedupe on event.payload...entity.id before fulfilling (idempotency)
  if (event.event === 'payment.captured') {
    // TODO: fulfillOrder(event.payload.payment.entity)
  }

  return new Response('ok', { status: 200 });
}
`,
};

mkdirSync(targetDir, { recursive: true });
writeFileSync(targetFile, templates[provider]);
console.log(`Created ${targetFile}`);
console.log(`Remember to set ${provider === 'stripe' ? 'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET' : 'RAZORPAY_WEBHOOK_SECRET'} in your env, and fill in the TODOs.`);
