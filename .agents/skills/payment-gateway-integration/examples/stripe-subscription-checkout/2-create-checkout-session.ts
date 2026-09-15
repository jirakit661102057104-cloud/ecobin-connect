'use server';

import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth'; // your auth helper — see auth-authorization skill

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(formData: FormData) {
  const priceId = formData.get('priceId') as string;
  const session = await auth();
  if (!session?.user) redirect('/login');

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 14 },
    customer_email: session.user.email,
    metadata: { userId: session.user.id },
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });

  redirect(checkoutSession.url!);
}
