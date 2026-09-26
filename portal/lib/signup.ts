import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type Stripe from 'stripe';
import { HttpError } from './http';
import { isUniqueError } from './db';
import { hashPassword, passwordOk } from './password';
import { formatDollars, planLabel, planMonthly } from './plans';
import { findOrCreateCustomer, formatBrand, getStripe, stripeHttpError } from './stripe';
import { insertAccountWithAcceptance, recordTermsEmailResult } from './terms-acceptance';
import { sendTermsAcceptanceEmail } from './terms-email';
import { getTermsDocument } from './terms';
import { getUserByEmail } from './users';
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
      // API 2026-08-26.dahlia rejects payment_method_types (400 payment_method_types_no_longer_supported).
      allowed_payment_method_types: ['card'],
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
    throw stripeHttpError(err, 'signup setup-intent');
  }
}

function optionalText(value: unknown): string {
  if (value == null) return '';
  const text = String(value).trim();
  if (!text || text === 'null' || text === 'undefined') return '';
  return text;
}

type AcceptanceInput = {
  signedName: string;
  termsVersion: string;
  termsContentHash: string;
  termsMarkdown: string;
  acceptedIp: string;
  acceptedUa: string;
};

async function emailAcceptedTerms(input: AcceptanceInput & {
  acceptanceId: string;
  email: string;
  fullName: string;
  plan: '3' | '12';
  acceptedAt: string;
}): Promise<void> {
  let resendId = '';
  try {
    resendId = await sendTermsAcceptanceEmail({
      to: input.email,
      fullName: input.fullName,
      planSummary: `${planLabel(input.plan)} · ${formatDollars(planMonthly(input.plan))}/mo`,
      signedName: input.signedName,
      termsVersion: input.termsVersion,
      termsContentHash: input.termsContentHash,
      acceptedAt: input.acceptedAt,
      ip: input.acceptedIp,
      markdown: input.termsMarkdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Email failed';
    console.error('terms acceptance email failed', input.acceptanceId, message);
    try {
      await recordTermsEmailResult(input.acceptanceId, { sentAt: null, error: message });
    } catch (updateErr) {
      console.error(
        'could not record terms email failure',
        input.acceptanceId,
        updateErr instanceof Error ? updateErr.message : 'error',
      );
    }
    return;
  }

  try {
    await recordTermsEmailResult(input.acceptanceId, {
      sentAt: new Date().toISOString(),
      error: '',
    });
    console.info('terms acceptance email sent', input.acceptanceId, resendId);
  } catch (err) {
    console.error(
      'terms acceptance email sent but the receipt was not saved',
      input.acceptanceId,
      err instanceof Error ? err.message : 'error',
    );
  }
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
} & AcceptanceInput): Promise<{ ok: true; email: string }> {
  const createdAt = new Date().toISOString();
  const userId = crypto.randomUUID();
  const acceptanceId = crypto.randomUUID();
  const passwordHash = await hashPassword(input.password);
  try {
    await insertAccountWithAcceptance(
      {
        id: userId,
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
      },
      {
        id: acceptanceId,
        userId,
        signedName: input.signedName,
        termsVersion: input.termsVersion,
        termsContentHash: input.termsContentHash,
        acceptedAt: createdAt,
        ip: input.acceptedIp,
        ua: input.acceptedUa,
      },
    );
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

  // Mail is not part of the account transaction. A failed send leaves
  // email_sent_at null and email_error set so ops can retry.
  await emailAcceptedTerms({
    acceptanceId,
    email: input.email,
    fullName: input.fullName,
    plan: input.plan,
    acceptedAt: createdAt,
    signedName: input.signedName,
    termsVersion: input.termsVersion,
    termsContentHash: input.termsContentHash,
    termsMarkdown: input.termsMarkdown,
    acceptedIp: input.acceptedIp,
    acceptedUa: input.acceptedUa,
  });
  return { ok: true, email: input.email };
}

export type SignupEvidence = {
  ip: string;
  userAgent: string;
};

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export async function completeSignup(
  body: unknown,
  evidence: SignupEvidence = { ip: '', userAgent: '' },
): Promise<{ ok: true; email: string }> {
  const record = asRecord(body);
  const email = normalizeEmail(String(record.email ?? ''));
  const fullName = normalizeName(String(record.fullName ?? ''));
  const plan = normalizePlan(String(record.plan ?? ''));
  const password = String(record.password ?? '');
  const termsAccepted = record.termsAccepted === true;
  const setupIntentId = optionalText(record.setupIntentId);
  const nonce = optionalText(record.nonce);
  const signedName = normalizeName(String(record.signedName ?? ''));
  const submittedVersion = optionalText(record.termsVersion);

  if (!termsAccepted) throw new HttpError(400, 'Agree to the Terms & Conditions to continue.');
  if (!email) throw new HttpError(400, 'Enter a work email.');
  if (!fullName) throw new HttpError(400, 'Enter your name.');
  if (!plan) throw new HttpError(400, 'Choose a 3-month or 12-month plan.');
  if (!passwordOk(password)) throw new HttpError(400, 'Use a password of 8 to 72 characters.');
  if (!signedName || !signedName.includes(' ')) {
    throw new HttpError(400, 'Type your full legal name to sign the Terms.');
  }

  const terms = getTermsDocument();
  if (submittedVersion && submittedVersion !== terms.version) {
    throw new HttpError(400, 'These Terms were updated. Refresh the page and agree to the current version.');
  }

  const acceptance: AcceptanceInput = {
    signedName,
    termsVersion: terms.version,
    termsContentHash: terms.contentHash,
    termsMarkdown: terms.markdown,
    acceptedIp: clip(evidence.ip || '', 80),
    acceptedUa: clip(evidence.userAgent || '', 512),
  };

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
      ...acceptance,
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
    throw stripeHttpError(err, 'signup setup-intent retrieve');
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
    throw stripeHttpError(err, 'signup complete');
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
    ...acceptance,
  });
}
