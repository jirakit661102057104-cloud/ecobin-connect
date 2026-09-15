'use server';

import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createPortalSession() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId!,
    return_url: `${process.env.NEXT_PUBLIC_URL}/settings/billing`,
  });

  redirect(portalSession.url);
}
