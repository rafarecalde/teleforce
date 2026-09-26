import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type Stripe from 'stripe';
import { HttpError } from './http';
import { isUniqueError } from './db';
import { hashPassword, passwordOk } from './password';
import { findOrCreateCustomer, formatBrand, getStripe, stripeHttpError } from './stripe';
import { getUserByEmail, insertUser } from './users';
import { asRecord, normalizeEmail, normalizeName, normalizePlan } from './validate';

const DUPLICATE = 'An account with this email already exists. Sign in to the client portal.';

function newNonce(): string {
  return randomBytes(32).toString('base64url');
}

function hashNonce(nonce: string): string {
  return createHash('sha256').update(nonce).digest('hex');
}

function nonceMatches(nonce: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashNonce(nonce));
  const expected = Buffer.from(expectedHash);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function idOf(value: string | { id: string } | null | undefined): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value.id;
}

export async function createSetup(body: unknown): Promise<{ clientSecret: string; nonce: string }> {
  const record = asRecord(body);
  const email = normalizeEmail(String(record.email ?? ''));
  const fullName = normalizeName(String(record.fullName ?? ''));
  const plan = normalizePlan(String(record.plan ?? ''));
  if (!email) throw new HttpError(400, 'Enter a work email.');
  if (!fullName) throw new HttpError(400, 'Enter your name.');
  if (!plan) throw new HttpError(400, 'Choose a 3-month or 12-month plan.');

  const existing = await getUserByEmail(email);
  if (existing) throw new HttpError(409, DUPLICATE);

  const nonce = newNonce();
  try {
    const stripe = getStripe();
    const customer = await findOrCreateCustomer(email, fullName);
    const intent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        email,
        fullName,
        plan,
        nonceHash: hashNonce(nonce),
        source: 'ea-signup',
      },
    });
    if (!intent.client_secret) throw new HttpError(502, 'Card setup could not be completed. Try again.');
    return { clientSecret: intent.client_secret, nonce };
  } catch (err) {
    throw stripeHttpError(err);
  }
}

function optionalText(value: unknown): string {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text || text === 'null' || text === 'undefined') return '';
  return text;
}

async function saveAccount(input: {
  email: string;
  fullName: string;
  password: string;
  plan: '3' | '12';
  stripeCustomerId: string | null;
  defaultPaymentMethodId: string | null;
  setupIntentId: string | null;
  cardBrand: string;
  cardLast4: string;
}): Promise<{ ok: true; email: string }> {
  const createdAt = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  try {
    await insertUser({
      id: crypto.randomUUID(),
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      plan: input.plan,
      termsAcceptedAt: createdAt,
      stripeCustomerId: input.stripeCustomerId,
      defaultPaymentMethodId: input.defaultPaymentMethodId,
      setupIntentId: input.setupIntentId,
      cardBrand: input.cardBrand,
      cardLast4: input.cardLast4,
      createdAt,
    });
  } catch (err) {
    if (isUniqueError(err)) {
      const again = await getUserByEmail(input.email);
      if (again && input.setupIntentId && again.setupIntentId === input.setupIntentId) {
        return { ok: true, email: input.email };
      }
      if (again) throw new HttpError(409, DUPLICATE);
      throw new HttpError(500, 'Could not create the account. Try again.');
    }
    throw err;
  }
  return { ok: true, email: input.email };
}

export async function completeSignup(body: unknown): Promise<{ ok: true; email: string }> {
  const record = asRecord(body);
  const email = normalizeEmail(String(record.email ?? ''));
  const fullName = normalizeName(String(record.fullName ?? ''));
  const plan = normalizePlan(String(record.plan ?? ''));
  const password = String(record.password ?? '');
  const termsAccepted = record.termsAccepted === true;
  const setupIntentId = optionalText(record.setupIntentId);
  const nonce = optionalText(record.nonce);

  if (!termsAccepted) throw new HttpError(400, 'Agree to the Terms & Conditions to continue.');
  if (!email) throw new HttpError(400, 'Enter a work email.');
  if (!fullName) throw new HttpError(400, 'Enter your name.');
  if (!plan) throw new HttpError(400, 'Choose a 3-month or 12-month plan.');
  if (!passwordOk(password)) throw new HttpError(400, 'Use a password of 8 to 72 characters.');

  if (!setupIntentId && !nonce) {
    const existing = await getUserByEmail(email);
    if (existing) throw new HttpError(409, DUPLICATE);
    return saveAccount({
      email,
      fullName,
      password,
      plan,
      stripeCustomerId: null,
      defaultPaymentMethodId: null,
      setupIntentId: null,
      cardBrand: '',
      cardLast4: '',
    });
  }

  if (!/^seti_[A-Za-z0-9]+$/.test(setupIntentId)) {
    throw new HttpError(400, 'Card setup did not finish. Try again.');
  }
  if (!nonce || nonce.length > 200) throw new HttpError(400, 'Card setup did not finish. Try again.');

  const existing = await getUserByEmail(email);
  if (existing) {
    if (existing.setupIntentId === setupIntentId) return { ok: true, email };
    throw new HttpError(409, DUPLICATE);
  }

  const stripe = getStripe();

  let intent: Stripe.SetupIntent;
  try {
    intent = await stripe.setupIntents.retrieve(setupIntentId, { expand: ['payment_method'] });
  } catch (err) {
    throw stripeHttpError(err);
  }

  if (intent.status !== 'succeeded') {
    throw new HttpError(400, 'The card was not saved. Check the card and try again.');
  }

  const meta = intent.metadata || {};
  if (meta.email !== email || meta.fullName !== fullName || meta.plan !== plan) {
    throw new HttpError(400, 'Signup details changed. Submit the form again.');
  }
  if (!meta.nonceHash || !nonceMatches(nonce, meta.nonceHash)) {
    throw new HttpError(400, 'Card setup did not finish. Try again.');
  }

  const customerId = idOf(intent.customer);
  const paymentMethod = intent.payment_method;
  const paymentMethodId = idOf(paymentMethod);
  if (!customerId || !paymentMethodId) {
    throw new HttpError(400, 'Card setup did not finish. Try again.');
  }

  let brand = 'Card';
  let last4 = '';
  if (paymentMethod && typeof paymentMethod !== 'string') {
    if (paymentMethod.type !== 'card' || !paymentMethod.card) {
      throw new HttpError(400, 'Use a card. Nothing was charged.');
    }
    brand = formatBrand(paymentMethod.card.brand);
    last4 = paymentMethod.card.last4 || '';
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || (customer.email || '').toLowerCase() !== email) {
      throw new HttpError(400, 'Card setup did not finish. Try again.');
    }
    if (!last4) {
      const fetched = await stripe.paymentMethods.retrieve(paymentMethodId);
      if (fetched.type !== 'card' || !fetched.card) {
        throw new HttpError(400, 'Use a card. Nothing was charged.');
      }
      brand = formatBrand(fetched.card.brand);
      last4 = fetched.card.last4 || '';
    }
    await stripe.customers.update(customerId, {
      name: fullName,
      invoice_settings: { default_payment_method: paymentMethodId },
      metadata: { source: 'ea-signup', plan },
    });
  } catch (err) {
    throw stripeHttpError(err);
  }

  return saveAccount({
    email,
    fullName,
    password,
    plan,
    stripeCustomerId: customerId,
    defaultPaymentMethodId: paymentMethodId,
    setupIntentId,
    cardBrand: brand,
    cardLast4: last4,
  });
}
