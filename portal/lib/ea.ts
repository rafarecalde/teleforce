import { randomBytes, randomUUID } from 'node:crypto';
import { db, isUniqueError } from './db';
import { HttpError } from './http';
import { portalHomeUrl } from './match-terms';
import { hashPassword } from './password';
import { getUserByEmail } from './users';
import { normalizeEmail, normalizeName } from './validate';

const INVITE_DAYS = 14;
const TOKEN = /^[A-Za-z0-9_-]{32}$/;

export type EaAccount = {
  id: string;
  email: string;
  fullName: string;
  /** Empty until the invite link is used. */
  passwordHash: string;
  createdAt: string;
};

export type EaClient = {
  id: string;
  fullName: string;
  company: string;
  email: string;
};

export type ClientChoice = {
  id: string;
  fullName: string;
  company: string;
};

export type EaAdminRow = {
  id: string;
  email: string;
  fullName: string;
  hasPassword: boolean;
  inviteUrl: string;
  inviteExpiresAt: string;
  client: { id: string; fullName: string } | null;
};

export type EaLinkPreview = {
  eaId: string;
  userId: string;
  eaName: string;
  clientName: string;
  replacedClientName: string;
  replacedEaName: string;
};

type Row = Record<string, unknown>;

function text(row: Row, key: string): string {
  const value = row[key];
  return value == null ? '' : String(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

function plusDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function assistantNameKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Match packages store "First Last". The invite uses that same name. */
export function parseAssistantName(raw: string): string | null {
  const name = normalizeName(raw);
  if (!name || !name.includes(' ')) return null;
  return name;
}

function mapEa(row: Row): EaAccount {
  return {
    id: text(row, 'id'),
    email: text(row, 'email'),
    fullName: text(row, 'full_name'),
    passwordHash: text(row, 'password_hash'),
    createdAt: text(row, 'created_at'),
  };
}

export function isInviteToken(value: string): boolean {
  return TOKEN.test(value);
}

export function inviteUrl(token: string): string {
  return `${portalHomeUrl().replace(/\/$/, '')}/ea/invite/${token}`;
}

export async function getEaByEmail(email: string): Promise<EaAccount | null> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT id, email, full_name, password_hash, created_at FROM ea_accounts WHERE email = ?',
    args: [email],
  });
  return result.rows[0] ? mapEa(result.rows[0]) : null;
}

export async function getEaById(id: string): Promise<EaAccount | null> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT id, email, full_name, password_hash, created_at FROM ea_accounts WHERE id = ?',
    args: [id],
  });
  return result.rows[0] ? mapEa(result.rows[0]) : null;
}

async function issueInvite(eaId: string): Promise<{ token: string; expiresAt: string }> {
  const client = await db();
  const token = randomBytes(24).toString('base64url');
  const expiresAt = plusDays(INVITE_DAYS);
  const stamp = nowIso();
  await client.execute({
    sql: `UPDATE ea_invites SET used_at = ? WHERE ea_id = ? AND used_at IS NULL`,
    args: [stamp, eaId],
  });
  await client.execute({
    sql: `INSERT INTO ea_invites (id, ea_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`,
    args: [randomUUID(), eaId, token, expiresAt, stamp],
  });
  return { token, expiresAt };
}

export async function createEaAccount(input: {
  email: string;
  fullName: string;
  linkByName: boolean;
}): Promise<{ id: string; inviteUrl: string; linked: number; matches: number; pendingUserId: string }> {
  const email = normalizeEmail(input.email);
  const fullName = parseAssistantName(input.fullName);
  if (!email) throw new HttpError(400, 'Enter a work email.');
  if (!fullName) throw new HttpError(400, 'Enter the assistant’s first and last name.');
  if (await getUserByEmail(email)) throw new HttpError(409, 'That email already has a client account.');
  if (await getEaByEmail(email)) throw new HttpError(409, 'An assistant account already uses that email.');

  const id = randomUUID();
  const client = await db();
  try {
    await client.execute({
      sql: `INSERT INTO ea_accounts (id, email, full_name, password_hash, created_at) VALUES (?, ?, ?, NULL, ?)`,
      args: [id, email, fullName, nowIso()],
    });
  } catch (err) {
    if (isUniqueError(err)) throw new HttpError(409, 'An assistant account already uses that email.');
    throw err;
  }
  const invite = await issueInvite(id);
  let linked = 0;
  let matches = 0;
  let pendingUserId = '';
  if (input.linkByName) {
    const found = await clientsMatchingAssistantName(fullName);
    matches = found.length;
    if (found.length === 1) {
      const result = await linkEaToClient(id, found[0].id);
      if (result === 'linked') linked = 1;
      if (result === 'confirm') pendingUserId = found[0].id;
    }
  }
  return { id, inviteUrl: inviteUrl(invite.token), linked, matches, pendingUserId };
}

export async function refreshEaInvite(eaId: string): Promise<string | null> {
  const ea = await getEaById(eaId);
  if (!ea) return null;
  const invite = await issueInvite(eaId);
  return inviteUrl(invite.token);
}

export type InvitePreview = {
  eaId: string;
  email: string;
  fullName: string;
};

export async function previewInvite(token: string): Promise<InvitePreview | null> {
  if (!isInviteToken(token)) return null;
  const client = await db();
  const result = await client.execute({
    sql: `SELECT i.ea_id, i.expires_at, i.used_at, e.email, e.full_name
          FROM ea_invites i
          JOIN ea_accounts e ON e.id = i.ea_id
          WHERE i.token = ?`,
    args: [token],
  });
  const row = result.rows[0];
  if (!row) return null;
  if (text(row, 'used_at')) return null;
  if (text(row, 'expires_at') <= nowIso()) return null;
  return { eaId: text(row, 'ea_id'), email: text(row, 'email'), fullName: text(row, 'full_name') };
}

export async function acceptInvite(token: string, passwordHash: string): Promise<EaAccount | null> {
  const preview = await previewInvite(token);
  if (!preview) return null;
  const client = await db();
  const stamp = nowIso();
  await client.execute({
    sql: 'UPDATE ea_accounts SET password_hash = ? WHERE id = ?',
    args: [passwordHash, preview.eaId],
  });
  await client.execute({
    sql: `UPDATE ea_invites SET used_at = ? WHERE token = ? AND used_at IS NULL`,
    args: [stamp, token],
  });
  return getEaById(preview.eaId);
}

export async function setInvitePassword(token: string, password: string): Promise<EaAccount | null> {
  return acceptInvite(token, await hashPassword(password));
}

export function linkReplaces(preview: EaLinkPreview): boolean {
  return Boolean(preview.replacedClientName || preview.replacedEaName);
}

/** Clients whose match name equals this assistant name. */
export async function clientsMatchingAssistantName(fullName: string): Promise<ClientChoice[]> {
  const key = assistantNameKey(fullName);
  if (!key) return [];
  const client = await db();
  const result = await client.execute(`
    SELECT u.id, u.full_name, u.company, u.matched_ea_name, IFNULL(m.ea_name, '') AS package_name
    FROM users u
    LEFT JOIN match_packages m ON m.user_id = u.id
    ORDER BY u.full_name COLLATE NOCASE, u.email
  `);
  return result.rows.flatMap((row) => {
    const matched = assistantNameKey(text(row, 'matched_ea_name'));
    const packaged = assistantNameKey(text(row, 'package_name'));
    if (matched !== key && packaged !== key) return [];
    return [{ id: text(row, 'id'), fullName: text(row, 'full_name'), company: text(row, 'company') }];
  });
}

export async function listClientChoices(): Promise<ClientChoice[]> {
  const client = await db();
  const result = await client.execute(
    `SELECT id, full_name, company FROM users ORDER BY full_name COLLATE NOCASE, email`,
  );
  return result.rows.map((row) => ({
    id: text(row, 'id'),
    fullName: text(row, 'full_name'),
    company: text(row, 'company'),
  }));
}

export async function previewEaLink(eaId: string, userId: string): Promise<EaLinkPreview | null> {
  const ea = await getEaById(eaId);
  if (!ea) return null;
  const client = await db();
  const user = await client.execute({
    sql: 'SELECT id, full_name, email FROM users WHERE id = ?',
    args: [userId],
  });
  const row = user.rows[0];
  if (!row) return null;
  const currentClient = await clientForEa(eaId);
  const currentEa = await assignmentForClient(userId);
  return {
    eaId,
    userId,
    eaName: ea.fullName,
    clientName: text(row, 'full_name') || text(row, 'email'),
    replacedClientName: currentClient && currentClient.id !== userId
      ? (currentClient.fullName || currentClient.email)
      : '',
    replacedEaName: currentEa && currentEa.id !== eaId ? currentEa.fullName : '',
  };
}

/**
 * One client per assistant. A new link drops the assistant's previous client
 * and any other assistant on this client. That replacement waits for confirm.
 */
export async function linkEaToClient(
  eaId: string,
  userId: string,
  options?: { confirm?: boolean },
): Promise<'linked' | 'confirm' | 'missing'> {
  const preview = await previewEaLink(eaId, userId);
  if (!preview) return 'missing';
  if (linkReplaces(preview) && !options?.confirm) return 'confirm';
  const current = await clientForEa(eaId);
  if (current?.id === userId && !preview.replacedEaName) return 'linked';
  const client = await db();
  try {
    await client.batch([
      {
        sql: 'DELETE FROM ea_assignments WHERE ea_id = ? OR user_id = ?',
        args: [eaId, userId],
      },
      {
        sql: 'INSERT INTO ea_assignments (user_id, ea_id, created_at) VALUES (?, ?, ?)',
        args: [userId, eaId, nowIso()],
      },
    ], 'write');
  } catch (err) {
    if (isUniqueError(err)) return 'missing';
    throw err;
  }
  return 'linked';
}

export async function unlinkEaFromClient(userId: string): Promise<void> {
  const client = await db();
  await client.execute({ sql: 'DELETE FROM ea_assignments WHERE user_id = ?', args: [userId] });
}

export async function eaCanAccessClient(eaId: string, userId: string): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT user_id FROM ea_assignments WHERE ea_id = ? AND user_id = ?',
    args: [eaId, userId],
  });
  return Boolean(result.rows[0]);
}

export async function assignmentForClient(userId: string): Promise<EaAccount | null> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT e.id, e.email, e.full_name, e.password_hash, e.created_at
          FROM ea_assignments a
          JOIN ea_accounts e ON e.id = a.ea_id
          WHERE a.user_id = ?`,
    args: [userId],
  });
  return result.rows[0] ? mapEa(result.rows[0]) : null;
}

export async function listEaAccounts(): Promise<EaAccount[]> {
  const client = await db();
  const result = await client.execute(
    'SELECT id, email, full_name, password_hash, created_at FROM ea_accounts ORDER BY full_name COLLATE NOCASE, email',
  );
  return result.rows.map(mapEa);
}

export async function listEaAdminRows(): Promise<EaAdminRow[]> {
  const accounts = await listEaAccounts();
  const client = await db();
  const links = await client.execute(`
    SELECT a.ea_id, a.user_id, u.full_name
    FROM ea_assignments a
    JOIN users u ON u.id = a.user_id
    ORDER BY u.full_name COLLATE NOCASE
  `);
  const byEa = new Map<string, { id: string; fullName: string }>();
  for (const row of links.rows) {
    const eaId = text(row, 'ea_id');
    if (byEa.has(eaId)) continue;
    byEa.set(eaId, { id: text(row, 'user_id'), fullName: text(row, 'full_name') });
  }
  const stamp = nowIso();
  const invites = await client.execute({
    sql: `SELECT ea_id, token, expires_at FROM ea_invites
          WHERE used_at IS NULL AND expires_at > ?
          ORDER BY created_at DESC`,
    args: [stamp],
  });
  const inviteByEa = new Map<string, { url: string; expiresAt: string }>();
  for (const row of invites.rows) {
    const eaId = text(row, 'ea_id');
    if (inviteByEa.has(eaId)) continue;
    inviteByEa.set(eaId, { url: inviteUrl(text(row, 'token')), expiresAt: text(row, 'expires_at') });
  }
  return accounts.map((account) => {
    const invite = inviteByEa.get(account.id);
    return {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      hasPassword: Boolean(account.passwordHash),
      inviteUrl: invite?.url || '',
      inviteExpiresAt: invite?.expiresAt || '',
      client: byEa.get(account.id) || null,
    };
  });
}

/** The one client this assistant is dedicated to. */
export async function clientForEa(eaId: string): Promise<EaClient | null> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT u.id, u.full_name, u.company, u.email
          FROM ea_assignments a
          JOIN users u ON u.id = a.user_id
          WHERE a.ea_id = ?`,
    args: [eaId],
  });
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: text(row, 'id'),
    fullName: text(row, 'full_name'),
    company: text(row, 'company'),
    email: text(row, 'email'),
  };
}
