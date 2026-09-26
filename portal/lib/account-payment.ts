import Stripe from 'stripe';
import { HttpError } from './http';
import { isUniqueError } from './db';
import { findOrCreateCustomer, formatBrand, getStripe, stripeHttpError } from './stripe';
import { getUserById, hasCardOnFile, updatePaymentMethod, type User } from './users';

/**
 * Signed-in card on file. SetupIntent only — no PaymentIntent, charge, invoice, or subscription.
 */
const SOURCE = 'portal-add-card';

function idOf(value: string | { id: string } | null | undefined): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value.id;
}

function missingCustomer(err: unknown): boolean {
  return err instanceof Stripe.errors.StripeError && err.code === 'resource_missing';
}

function isLiveCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer,
): customer is Stripe.Customer {
  return !('deleted' in customer && customer.deleted);
}

async function customerForAccount(user: User): Promise<Stripe.Customer> {
  const stripe = getStripe();
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (isLiveCustomer(existing) && (existing.email || '').toLowerCase() === user.email) {
        return existing;
      }
    } catch (err) {
      if (!missingCustomer(err)) throw err;
    }
  }
  return findOrCreateCustomer(user.email, user.fullName, {
    source: SOURCE,
    userId: user.id,
  });
}

export async function createAccountSetup(user: User): Promise<{ clientSecret: string }> {
  try {
    const stripe = getStripe();
    const customer = await customerForAccount(user);
    const intent = await stripe.setupIntents.create({
      customer: customer.id,
      // API 2026-08-26.dahlia rejects payment_method_types (400 payment_method_types_no_longer_supported).
      allowed_payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: user.id,
        email: user.email,
        source: SOURCE,
      },
    });
    if (!intent.client_secret) throw new HttpError(502, 'Card setup could not be completed. Try again.');
    return { clientSecret: intent.client_secret };
  } catch (err) {
    throw stripeHttpError(err, 'portal setup-intent');
  }
}

async function cardDetails(
  paymentMethod: Stripe.SetupIntent['payment_method'],
  paymentMethodId: string,
): Promise<{ brand: string; last4: string; customerId: string }> {
  if (paymentMethod && typeof paymentMethod !== 'string') {
    if (paymentMethod.type !== 'card' || !paymentMethod.card) {
      throw new HttpError(400, 'Use a card. Nothing was charged.');
    }
    const customerId = idOf(paymentMethod.customer);
    return {
      brand: formatBrand(paymentMethod.card.brand),
      last4: paymentMethod.card.last4 || '',
      customerId,
    };
  }
  const stripe = getStripe();
  const fetched = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (fetched.type !== 'card' || !fetched.card) {
    throw new HttpError(400, 'Use a card. Nothing was charged.');
  }
  return {
    brand: formatBrand(fetched.card.brand),
    last4: fetched.card.last4 || '',
    customerId: idOf(fetched.customer),
  };
}

export async function saveAccountPaymentMethod(
  user: User,
  setupIntentId: string,
): Promise<{ brand: string; last4: string }> {
  if (!/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) {
    throw new HttpError(400, 'Card setup did not finish. Try again.');
  }

  const stripe = getStripe();
  let intent: Stripe.SetupIntent;
  try {
    intent = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['payment_method'] });
  } catch (err) {
    throw stripeHttpError(err, 'portal setup-intent retrieve');
  }

  if (intent.status !== 'succeeded') {
    throw new HttpError(400, 'The card was not saved. Check the card and try again.');
  }

  const meta = intent.metadata || {};
  if (meta.source !== SOURCE || meta.userId !== user.id || meta.email !== user.email) {
    throw new HttpError(400, 'Card setup did not finish. Try again.');
  }

  const customerId = idOf(intent.customer);
  const paymentMethodId = idOf(intent.payment_method);
  if (!customerId || !paymentMethodId) {
    throw new HttpError(400, 'Card setup did not finish. Try again.');
  }

  let brand = 'Card';
  let last4 = '';
  try {
    const card = await cardDetails(intent.payment_method, paymentMethodId);
    if (!card.last4) throw new HttpError(400, 'Use a card. Nothing was charged.');
    if (card.customerId && card.customerId !== customerId) {
      throw new HttpError(400, 'Card setup did not finish. Try again.');
    }
    brand = card.brand;
    last4 = card.last4;

    const customer = await stripe.customers.retrieve(customerId);
    if (!isLiveCustomer(customer) || (customer.email || '').toLowerCase() !== user.email) {
      throw new HttpError(400, 'Card setup did not finish. Try again.');
    }
  } catch (err) {
    throw stripeHttpError(err, 'portal payment method');
  }

  const current = await getUserById(user.id);
  if (!current) throw new HttpError(401, 'Sign in required.');
  if (hasCardOnFile(current) && current.defaultPaymentMethodId !== paymentMethodId) {
    throw new HttpError(409, 'A card is already on file.');
  }

  try {
    const updated = await updatePaymentMethod(current.id, {
      stripeCustomerId: customerId,
      defaultPaymentMethodId: paymentMethodId,
      setupIntentId,
      cardBrand: brand,
      cardLast4: last4,
    });
    if (updated < 1) {
      const again = await getUserById(current.id);
      if (again?.defaultPaymentMethodId === paymentMethodId) {
        // The same card was stored by a concurrent save.
      } else if (again && hasCardOnFile(again)) {
        throw new HttpError(409, 'A card is already on file.');
      } else {
        throw new HttpError(500, 'Could not save the card. Try again.');
      }
    }
  } catch (err) {
    if (err instanceof HttpError) throw err;
    if (isUniqueError(err)) throw new HttpError(400, 'Card setup did not finish. Try again.');
    throw err;
  }

  try {
    await stripe.customers.update(customerId, {
      name: user.fullName,
      email: user.email,
      invoice_settings: { default_payment_method: paymentMethodId },
    });
  } catch (err) {
    throw stripeHttpError(err, 'portal default payment method');
  }

  return { brand, last4 };
}

/** Idempotent. Used when the card is already stored and Stripe’s default still needs to match. */
export async function ensureDefaultCard(user: User): Promise<void> {
  if (!hasCardOnFile(user) || !user.stripeCustomerId) return;
  try {
    const stripe = getStripe();
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: user.defaultPaymentMethodId },
    });
  } catch (err) {
    throw stripeHttpError(err, 'portal ensure default card');
  }
}
