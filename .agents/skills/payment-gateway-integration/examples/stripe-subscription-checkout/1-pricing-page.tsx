import { createCheckoutSession } from '@/actions/create-checkout-session';

const TIERS = [
  { name: 'Starter', priceId: 'price_starter_monthly', price: '$9/mo' },
  { name: 'Pro', priceId: 'price_pro_monthly', price: '$29/mo' },
  { name: 'Team', priceId: 'price_team_monthly', price: '$79/mo' },
];

export default function PricingPage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {TIERS.map((tier) => (
        <form key={tier.priceId} action={createCheckoutSession}>
          <input type="hidden" name="priceId" value={tier.priceId} />
          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">{tier.name}</h3>
            <p className="text-2xl mt-2">{tier.price}</p>
            <button type="submit" className="mt-4 w-full rounded-md bg-brand-600 text-white py-2">
              Subscribe
            </button>
          </div>
        </form>
      ))}
    </div>
  );
}
