import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('3', '12')),
  terms_accepted_at TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  default_payment_method_id TEXT NOT NULL,
  setup_intent_id TEXT NOT NULL UNIQUE,
  card_brand TEXT NOT NULL DEFAULT '',
  card_last4 TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  billing_contact TEXT NOT NULL DEFAULT '',
  billing_email TEXT NOT NULL DEFAULT '',
  billing_address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
)`;

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

export async function db(): Promise<Client> {
  const current = getClient();
  if (!ready) {
    ready = current.execute(SCHEMA).then(
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
