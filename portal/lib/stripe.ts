import Stripe from 'stripe';
import { HttpError } from './http';

let stripe: Stripe | null = null;

/** Customers and SetupIntents only, and only when a card is submitted. Do not create PaymentIntents, Charges, Subscriptions, or Invoices here. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new HttpError(503, 'Payments are not configured.');
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

/** Reuse a Customer with this email, or create one. Does not charge. */
export async function findOrCreateCustomer(
  email: string,
  fullName: string,
  metadata: Record<string, string> = { source: 'ea-signup' },
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const listed = await stripe.customers.list({ email, limit: 10 });
  const found = listed.data.find((customer) => (customer.email || '').toLowerCase() === email);
  if (found) {
    if (found.name !== fullName) {
      return stripe.customers.update(found.id, { name: fullName });
    }
    return found;
  }
  return stripe.customers.create({
    email,
    name: fullName,
    metadata,
  });
}

export function publishableKey(): string {
  const key = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) throw new HttpError(503, 'Payments are not configured.');
  return key;
}

const BRANDS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
};

export function formatBrand(brand?: string | null): string {
  if (!brand) return 'Card';
  return BRANDS[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function stripeHttpError(err: unknown): HttpError {
  if (err instanceof HttpError) return err;
  if (err instanceof Stripe.errors.StripeError) {
    console.error('stripe', err.type, err.code || '', err.requestId || '');
    return new HttpError(502, 'Card setup could not be completed. Try again.');
  }
  console.error('stripe', err instanceof Error ? err.message : 'error');
  return new HttpError(502, 'Card setup could not be completed. Try again.');
}

export async function retrieveCard(paymentMethodId: string): Promise<{ brand: string; last4: string }> {
  const pm = await getStripe().paymentMethods.retrieve(paymentMethodId);
  if (pm.type !== 'card' || !pm.card) {
    return { brand: 'Card', last4: '' };
  }
  return { brand: formatBrand(pm.card.brand), last4: pm.card.last4 || '' };
}
