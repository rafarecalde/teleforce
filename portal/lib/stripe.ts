import Stripe from 'stripe';
import { LIVE_STATUSES } from './constants';

// Stripe secret key is server-side ONLY. This module must never be imported by
// a client component.
// Placeholder default keeps module load from throwing at build time; the real
// key is present at runtime. No API call is made without a real key.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-06-20',
  appInfo: { name: 'teleforce-portal' },
});

export type Sub = Stripe.Subscription;

/** Find the single Stripe customer that owns an email (case-insensitive). */
export async function getCustomerByEmail(
  email: string,
): Promise<Stripe.Customer | null> {
  const res = await stripe.customers.list({
    email: email.toLowerCase().trim(),
    limit: 1,
  });
  const c = res.data[0];
  return c && !c.deleted ? c : null;
}

/** All currently-in-effect subscriptions for a customer, price expanded. */
export async function getLiveSubscriptions(customerId: string): Promise<Sub[]> {
  const res = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 50,
    expand: ['data.items.data.price'],
  });
  return res.data.filter((s) => LIVE_STATUSES.includes(s.status));
}

/** The primary price on a subscription (one EA = one item). */
export function subPrice(sub: Sub): Stripe.Price | null {
  const price = sub.items.data[0]?.price;
  return typeof price === 'object' ? price : null;
}

export async function getPrice(priceId: string): Promise<Stripe.Price> {
  return stripe.prices.retrieve(priceId);
}
