# Razorpay Integration Reference (India-first businesses)

## Install
```bash
npm i razorpay
```

## Create an order (server-side)
```ts
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
const order = await razorpay.orders.create({
  amount: amountInPaise, // Razorpay amounts are in the smallest currency unit (paise for INR)
  currency: 'INR',
  receipt: `order_${internalOrderId}`,
  notes: { userId },
});
```

## Client-side checkout (Razorpay Checkout.js)
```tsx
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // public key only
  amount: order.amount,
  currency: order.currency,
  order_id: order.id,
  handler: (response) => {
    // response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
    // send to your server to verify — do NOT trust this alone, confirm via webhook too
  },
};
const rzp = new window.Razorpay(options);
rzp.open();
```

## Verify payment signature (server-side, after client handler AND via webhook)
```ts
import crypto from 'crypto';
function isValidSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`).digest('hex');
  return expected === signature;
}
```

## Webhooks (the actual source of truth)
Configure webhook URL + secret in the Razorpay dashboard, listen for `payment.captured`, `payment.failed`, `subscription.charged`, `subscription.cancelled`.
```ts
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature')!;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(body).digest('hex');
  if (expected !== signature) return new Response('Invalid signature', { status: 400 });

  const event = JSON.parse(body);
  if (event.event === 'payment.captured') {
    await fulfillOrder(event.payload.payment.entity); // dedupe on event id
  }
  return new Response('ok');
}
```

## Subscriptions
Create a `Plan`, then a `Subscription` linked to a customer; Razorpay handles recurring charges and fires `subscription.charged`/`subscription.cancelled` webhooks — sync your DB's subscription status from these events, same pattern as Stripe.

## India-specific compliance notes
- GST-compliant invoicing: Razorpay can auto-generate GST invoices if your business/tax details are configured in the dashboard — don't hand-roll invoice numbering/tax calculation.
- UPI AutoPay is the standard recurring-payment mechanism for Indian subscriptions (card recurring has RBI additional-factor-authentication requirements) — use Razorpay's UPI AutoPay/e-mandate flow for subscription products targeting Indian users.
- Amounts are always in the smallest unit (paise, not rupees) — a common integration bug is off-by-100x amounts.

## Testing
- Use test mode API keys; test card/UPI details are provided in the Razorpay dashboard's test mode documentation.
