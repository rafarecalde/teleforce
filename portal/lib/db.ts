import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';

const USER_TABLE = `
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('3', '12')),
  terms_accepted_at TEXT NOT NULL,
  stripe_customer_id TEXT,
  default_payment_method_id TEXT,
  setup_intent_id TEXT UNIQUE,
  card_brand TEXT NOT NULL DEFAULT '',
  card_last4 TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  billing_contact TEXT NOT NULL DEFAULT '',
  billing_email TEXT NOT NULL DEFAULT '',
  billing_address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
`;

const SCHEMA = `CREATE TABLE IF NOT EXISTS users (${USER_TABLE})`;

/** Additional dedicated EA seats. Ops bills the same Stripe customer later. No charge is created here. */
const EA_REQUESTS_SCHEMA = `
  CREATE TABLE IF NOT EXISTS ea_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    focus TEXT NOT NULL,
    tasks TEXT NOT NULL,
    bilingual TEXT NOT NULL,
    start_timing TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    schedule TEXT NOT NULL DEFAULT 'full-time',
    ack_version TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;

const EA_REQUESTS_INDEX = `CREATE INDEX IF NOT EXISTS ea_requests_user_id ON ea_requests (user_id)`;

/**
 * One row per acceptance. Older accounts may have only users.terms_accepted_at
 * and no row here; login does not read this table. A later Terms version does
 * not ask those accounts to accept again.
 */
const TERMS_ACCEPTANCES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS terms_acceptances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    signed_name TEXT NOT NULL,
    terms_version TEXT NOT NULL,
    terms_content_hash TEXT NOT NULL,
    accepted_at TEXT NOT NULL,
    ip TEXT NOT NULL DEFAULT '',
    ua TEXT NOT NULL DEFAULT '',
    email_sent_at TEXT,
    email_error TEXT NOT NULL DEFAULT ''
  )
`;

const TERMS_ACCEPTANCES_INDEX = `CREATE INDEX IF NOT EXISTS terms_acceptances_user_id ON terms_acceptances (user_id)`;

const REBUILD_PAYMENT_OPTIONAL = `
BEGIN IMMEDIATE;
DROP TABLE IF EXISTS users_payment_optional;
CREATE TABLE users_payment_optional (${USER_TABLE});
INSERT INTO users_payment_optional (
  id, email, full_name, password_hash, plan, terms_accepted_at,
  stripe_customer_id, default_payment_method_id, setup_intent_id,
  card_brand, card_last4, company, billing_contact, billing_email, billing_address,
  created_at
)
SELECT
  id, email, full_name, password_hash, plan, terms_accepted_at,
  NULLIF(stripe_customer_id, ''),
  NULLIF(default_payment_method_id, ''),
  NULLIF(setup_intent_id, ''),
  card_brand, card_last4, company, billing_contact, billing_email, billing_address,
  created_at
FROM users;
DROP TABLE users;
ALTER TABLE users_payment_optional RENAME TO users;
COMMIT;
`;

let client: Client | null = null;
let ready: Promise<void> | null = null;

export function databaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  const building = process.env.NEXT_PHASE === 'phase-production-build';
  if (process.env.NODE_ENV === 'production' && !building) {
    throw new Error('TURSO_DATABASE_URL is required in production');
  }
  return 'file:./data/teleforce.db';
}

function ensureLocalDirectory(url: string) {
  if (!url.startsWith('file:')) return;
  const spec = url.slice('file:'.length).replace(/^\/\//, '');
  const abs = path.isAbsolute(spec) ? spec : path.resolve(process.cwd(), spec);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
}

function getClient(): Client {
  if (client) return client;
  const url = databaseUrl();
  ensureLocalDirectory(url);
  client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
  return client;
}

async function setupIntentRequired(current: Client): Promise<boolean> {
  const result = await current.execute('PRAGMA table_info(users)');
  const column = result.rows.find((row) => String(row.name) === 'setup_intent_id');
  if (!column) return false;
  return Number(column.notnull) === 1;
}

/**
 * Early accounts required a SetupIntent. Card-optional signup stores NULL for
 * stripe_customer_id, default_payment_method_id, and setup_intent_id.
 * SQLite cannot drop NOT NULL in place, so an existing table is rebuilt once.
 * NULL setup_intent_id values stay unique-compatible (many NULLs are allowed).
 */
async function migratePaymentOptional(current: Client): Promise<void> {
  if (!(await setupIntentRequired(current))) return;
  try {
    await current.executeMultiple(REBUILD_PAYMENT_OPTIONAL);
  } catch (err) {
    try {
      await current.execute('ROLLBACK');
    } catch {
      // The failed script may not have left a transaction open.
    }
    throw err;
  }
}

export async function db(): Promise<Client> {
  const current = getClient();
  if (!ready) {
    ready = current
      .execute(SCHEMA)
      .then(() => current.execute(EA_REQUESTS_SCHEMA))
      .then(() => current.execute(EA_REQUESTS_INDEX))
      .then(() => current.execute(TERMS_ACCEPTANCES_SCHEMA))
      .then(() => current.execute(TERMS_ACCEPTANCES_INDEX))
      .then(() => migratePaymentOptional(current))
      .then(
        () => undefined,
        (err) => {
          ready = null;
          throw err;
        },
      );
  }
  await ready;
  return current;
}

export function isUniqueError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /UNIQUE constraint failed/i.test(message) || /SQLITE_CONSTRAINT/i.test(message);
}
