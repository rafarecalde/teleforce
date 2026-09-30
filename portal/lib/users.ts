import { db } from './db';
import type { PlanCode } from './plans';

export type User = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  plan: PlanCode;
  termsAcceptedAt: string;
  stripeCustomerId: string;
  defaultPaymentMethodId: string;
  setupIntentId: string;
  cardBrand: string;
  cardLast4: string;
  company: string;
  billingContact: string;
  billingEmail: string;
  billingAddress: string;
  /** ISO timestamp once ops marks the onboarding call complete. Empty until then. */
  onboardingCompletedAt: string;
  /** "First Last" once ops assigns the assistant. Empty until then. */
  matchedEaName: string;
  createdAt: string;
};

export type NewUser = {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  plan: PlanCode;
  termsAcceptedAt: string;
  stripeCustomerId: string | null;
  defaultPaymentMethodId: string | null;
  setupIntentId: string | null;
  cardBrand: string;
  cardLast4: string;
  createdAt: string;
};

export function hasCardOnFile(user: Pick<User, 'defaultPaymentMethodId'>): boolean {
  return user.defaultPaymentMethodId.trim().length > 0;
}

/** Collapses whitespace. An empty result means the client is not matched yet. */
export function displayMatchedEa(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function onboardingIsComplete(value: string): boolean {
  return value.trim().length > 0;
}

type Row = Record<string, unknown>;

const COLUMNS = `
  id, email, full_name, password_hash, plan, terms_accepted_at,
  stripe_customer_id, default_payment_method_id, setup_intent_id,
  card_brand, card_last4, company, billing_contact, billing_email, billing_address,
  onboarding_completed_at, matched_ea_name, created_at
`;

function text(row: Row, key: string): string {
  const value = row[key];
  return value == null ? '' : String(value);
}

function mapUser(row: Row): User {
  const plan = text(row, 'plan') === '12' ? '12' : '3';
  const email = text(row, 'email');
  const fullName = text(row, 'full_name');
  return {
    id: text(row, 'id'),
    email,
    fullName,
    passwordHash: text(row, 'password_hash'),
    plan,
    termsAcceptedAt: text(row, 'terms_accepted_at'),
    stripeCustomerId: text(row, 'stripe_customer_id'),
    defaultPaymentMethodId: text(row, 'default_payment_method_id'),
    setupIntentId: text(row, 'setup_intent_id'),
    cardBrand: text(row, 'card_brand'),
    cardLast4: text(row, 'card_last4'),
    company: text(row, 'company'),
    billingContact: text(row, 'billing_contact') || fullName,
    billingEmail: text(row, 'billing_email') || email,
    billingAddress: text(row, 'billing_address'),
    onboardingCompletedAt: text(row, 'onboarding_completed_at'),
    matchedEaName: displayMatchedEa(text(row, 'matched_ea_name')),
    createdAt: text(row, 'created_at'),
  };
}

async function one(sql: string, args: string[]): Promise<User | null> {
  const client = await db();
  const result = await client.execute({ sql, args });
  const row = result.rows[0] as unknown as Row | undefined;
  return row ? mapUser(row) : null;
}

export function getUserByEmail(email: string): Promise<User | null> {
  return one(`SELECT ${COLUMNS} FROM users WHERE email = ?`, [email]);
}

export function getUserById(id: string): Promise<User | null> {
  return one(`SELECT ${COLUMNS} FROM users WHERE id = ?`, [id]);
}

export function userInsert(user: NewUser): { sql: string; args: (string | null)[] } {
  return {
    sql: `INSERT INTO users (
      id, email, full_name, password_hash, plan, terms_accepted_at,
      stripe_customer_id, default_payment_method_id, setup_intent_id,
      card_brand, card_last4, company, billing_contact, billing_email, billing_address,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', ?)`,
    args: [
      user.id,
      user.email,
      user.fullName,
      user.passwordHash,
      user.plan,
      user.termsAcceptedAt,
      user.stripeCustomerId,
      user.defaultPaymentMethodId,
      user.setupIntentId,
      user.cardBrand,
      user.cardLast4,
      user.createdAt,
    ],
  };
}

export async function insertUser(user: NewUser): Promise<void> {
  const client = await db();
  await client.execute(userInsert(user));
}

export async function updatePaymentMethod(
  id: string,
  fields: {
    stripeCustomerId: string;
    defaultPaymentMethodId: string;
    setupIntentId: string;
    cardBrand: string;
    cardLast4: string;
  },
  previousPaymentMethodId: string,
): Promise<number> {
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE users
      SET stripe_customer_id = ?,
          default_payment_method_id = ?,
          setup_intent_id = ?,
          card_brand = ?,
          card_last4 = ?
      WHERE id = ?
        AND IFNULL(default_payment_method_id, '') = ?`,
    args: [
      fields.stripeCustomerId,
      fields.defaultPaymentMethodId,
      fields.setupIntentId,
      fields.cardBrand,
      fields.cardLast4,
      id,
      previousPaymentMethodId,
    ],
  });
  return Number(result.rowsAffected);
}

export async function updateBilling(
  id: string,
  fields: { company: string; billingContact: string; billingEmail: string; billingAddress: string },
): Promise<void> {
  const client = await db();
  await client.execute({
    sql: `UPDATE users
      SET company = ?, billing_contact = ?, billing_email = ?, billing_address = ?
      WHERE id = ?`,
    args: [fields.company, fields.billingContact, fields.billingEmail, fields.billingAddress, id],
  });
}
