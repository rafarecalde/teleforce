import type Stripe from 'stripe';
import type { PlanCode } from './plans';
import { getStripe } from './stripe';

/** Subscriptions are created only when this is the string "true". */
export function stripeAutoBillingEnabled(): boolean {
  return process.env.STRIPE_AUTO_BILLING?.trim() === 'true';
}

export function priceIdForPlan(plan: PlanCode): string {
  const raw = plan === '12' ? process.env.STRIPE_PRICE_12 : process.env.STRIPE_PRICE_3;
  return (raw || '').trim();
}

export type SubscriptionResult =
  | { ok: true; subscriptionId: string }
  | { ok: false; reason: 'off' | 'customer' | 'card' | 'price' | 'date' | 'stripe' };

/**
 * Creates one subscription on the saved card, anchored to the billing start.
 * Safe to call again: the idempotency key is the client and that start time.
 * Returns a reason instead of throwing. Does nothing when auto billing is off.
 */
export async function createMatchSubscription(input: {
  userId: string;
  plan: PlanCode;
  customerId: string;
  paymentMethodId: string;
  billingStartAt: string;
}): Promise<SubscriptionResult> {
  if (!stripeAutoBillingEnabled()) return { ok: false, reason: 'off' };
  if (!/^cus_[A-Za-z0-9]+$/.test(input.customerId)) return { ok: false, reason: 'customer' };
  if (!/^pm_[A-Za-z0-9]+$/.test(input.paymentMethodId)) return { ok: false, reason: 'card' };
  const price = priceIdForPlan(input.plan);
  if (!/^price_[A-Za-z0-9]+$/.test(price)) return { ok: false, reason: 'price' };
  const anchorMs = new Date(input.billingStartAt).getTime();
  if (Number.isNaN(anchorMs)) return { ok: false, reason: 'date' };
  const anchor = Math.floor(anchorMs / 1000);
  const now = Math.floor(Date.now() / 1000);
  const params: Stripe.SubscriptionCreateParams = {
    customer: input.customerId,
    items: [{ price }],
    default_payment_method: input.paymentMethodId,
    collection_method: 'charge_automatically',
    proration_behavior: 'none',
    metadata: { user_id: input.userId, source: 'teleforce-match' },
  };
  if (anchor > now + 120) {
    params.billing_cycle_anchor = anchor;
    params.trial_end = anchor;
  } else if (now - anchor > 120) {
    params.backdate_start_date = anchor;
    params.billing_cycle_anchor = anchor;
  }
  try {
    const subscription = await getStripe().subscriptions.create(params, {
      idempotencyKey: `match-sub-${input.userId}-${anchor}`.slice(0, 255),
    });
    if (!subscription.id) return { ok: false, reason: 'stripe' };
    return { ok: true, subscriptionId: subscription.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'stripe';
    console.error('match subscription failed', message.replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[key]').slice(0, 300));
    return { ok: false, reason: 'stripe' };
  }
}
