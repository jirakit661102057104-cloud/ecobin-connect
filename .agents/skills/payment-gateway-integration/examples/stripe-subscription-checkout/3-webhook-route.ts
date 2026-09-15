import Stripe from 'stripe';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  // Idempotency: skip if we've already processed this event id
  const alreadyProcessed = await db.webhookEvent.findUnique({ where: { id: event.id } });
  if (alreadyProcessed) return new Response('ok', { status: 200 });

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await db.user.update({
        where: { id: session.metadata!.userId },
        data: { stripeCustomerId: session.customer as string, subscriptionStatus: 'active' },
      });
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await db.user.updateMany({
        where: { stripeCustomerId: sub.customer as string },
        data: { subscriptionStatus: sub.status },
      });
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // TODO: notify the user, don't hard-cancel — follow Stripe's retry/dunning schedule
      break;
    }
  }

  await db.webhookEvent.create({ data: { id: event.id, type: event.type } });
  return new Response('ok', { status: 200 });
}
