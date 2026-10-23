import { addBusinessDays } from './business-days';
import { db } from './db';
import type { PlanCode } from './plans';
import { normalizeEmail, normalizeName, normalizeOptional } from './validate';
import { getUserById } from './users';

const DEFAULT_ADMIN_EMAIL = 'rafael@recaldelaw.com';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type MatchPackage = {
  userId: string;
  eaName: string;
  eaPhotoUrl: string;
  eaVideoUrl: string;
  experience: string;
  languages: string;
  tools: string;
  strengths: string;
  timezone: string;
  hours: string;
  pmName: string;
  pmEmail: string;
  pmPhotoUrl: string;
  matchReadyAt: string;
  matchAcceptedAt: string;
  matchAcceptedIp: string;
  matchAcceptedUa: string;
  /** portal, email, or auto. Empty until the client accepts. */
  acceptanceMethod: string;
  declinedAt: string;
  /** 1 for the first introduction, 2 after the one allowed decline. */
  presentation: number;
  reminderSentAt: string;
  billingStartAt: string;
  stripeSubscriptionId: string;
  billingNotifiedAt: string;
  clientNotifiedAt: string;
  kickoffBooked: boolean;
  kickoffCompletedAt: string;
  updatedAt: string;
};

export type AcceptanceMethod = 'portal' | 'email' | 'auto';

export type MatchDraft = {
  eaName: string;
  eaPhotoUrl: string;
  eaVideoUrl: string;
  experience: string;
  languages: string;
  tools: string;
  strengths: string;
  timezone: string;
  hours: string;
  pmName: string;
  pmEmail: string;
  pmPhotoUrl: string;
};

export type MatchSaveError = 'missing' | 'name' | 'photo' | 'video' | 'pm' | 'fields' | 'limit' | 'save';

export type MatchSaveResult = { ok: true; eaName: string; pmName: string; pmEmail: string } | { ok: false; error: MatchSaveError };

export type AdminClient = {
  id: string;
  email: string;
  fullName: string;
  plan: PlanCode;
  createdAt: string;
  onboardingCompletedAt: string;
  matchedEaName: string;
  hasPackage: boolean;
  eaName: string;
  matchReadyAt: string;
  matchAcceptedAt: string;
  kickoffBooked: boolean;
  kickoffCompletedAt: string;
  acceptanceMethod: string;
  declinedAt: string;
  presentation: number;
  billingStartAt: string;
  declines: number;
  rematches: number;
  departures: number;
};

type Row = Record<string, unknown>;

/** Blank or unset `ADMIN_EMAILS` uses the default. Otherwise a comma-separated allowlist. */
export function adminEmails(): string[] {
  const configured = process.env.ADMIN_EMAILS;
  const source = configured == null || configured.trim() === '' ? DEFAULT_ADMIN_EMAIL : configured;
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of source.split(',')) {
    const email = part.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  return emails;
}

export function isAdminEmail(email: string): boolean {
  return adminEmails().includes(email.trim().toLowerCase());
}

export function isUserId(value: string): boolean {
  return UUID.test(value);
}

export function defaultPartnershipManager(): { name: string; email: string } {
  return {
    name: (process.env.DEFAULT_PARTNERSHIP_MANAGER_NAME || '').trim().replace(/\s+/g, ' '),
    email: (process.env.DEFAULT_PARTNERSHIP_MANAGER_EMAIL || '').trim(),
  };
}

export function describeMatch(row: Pick<AdminClient, 'hasPackage' | 'matchedEaName' | 'eaName' | 'matchReadyAt' | 'matchAcceptedAt' | 'kickoffBooked' | 'kickoffCompletedAt' | 'acceptanceMethod' | 'declinedAt'>): string {
  const name = row.eaName || row.matchedEaName;
  const withName = (label: string) => (name ? `${label} · ${name}` : label);
  if (row.kickoffCompletedAt) return withName('Kickoff done');
  if (row.matchAcceptedAt) {
    const how = row.acceptanceMethod === 'auto' ? 'Accepted automatically' : 'Accepted';
    return withName(row.kickoffBooked ? `${how}, kickoff booked` : how);
  }
  if (row.declinedAt) return withName('Asked for another match');
  if (row.matchReadyAt) return withName('Awaiting acceptance');
  if (row.hasPackage) return withName('Draft');
  if (row.matchedEaName) return `Name on file · ${row.matchedEaName}`;
  return 'Not matched';
}

function text(row: Row, key: string): string {
  const value = row[key];
  return value == null ? '' : String(value);
}

function mapMatch(row: Row): MatchPackage {
  return {
    userId: text(row, 'user_id'),
    eaName: text(row, 'ea_name').trim().replace(/\s+/g, ' '),
    eaPhotoUrl: text(row, 'ea_photo_url'),
    eaVideoUrl: text(row, 'ea_video_url'),
    experience: text(row, 'ea_experience'),
    languages: text(row, 'ea_languages'),
    tools: text(row, 'ea_tools'),
    strengths: text(row, 'ea_strengths'),
    timezone: text(row, 'ea_timezone'),
    hours: text(row, 'ea_hours'),
    pmName: text(row, 'pm_name'),
    pmEmail: text(row, 'pm_email'),
    pmPhotoUrl: text(row, 'pm_photo_url'),
    matchReadyAt: text(row, 'match_ready_at'),
    matchAcceptedAt: text(row, 'match_accepted_at'),
    matchAcceptedIp: text(row, 'match_accepted_ip'),
    matchAcceptedUa: text(row, 'match_accepted_ua'),
    acceptanceMethod: text(row, 'acceptance_method'),
    declinedAt: text(row, 'declined_at'),
    presentation: Number(row.presentation) === 2 ? 2 : 1,
    reminderSentAt: text(row, 'reminder_sent_at'),
    billingStartAt: text(row, 'billing_start_at'),
    stripeSubscriptionId: text(row, 'stripe_subscription_id'),
    billingNotifiedAt: text(row, 'billing_notified_at'),
    clientNotifiedAt: text(row, 'client_notified_at'),
    kickoffBooked: Number(row.kickoff_booked) === 1,
    kickoffCompletedAt: text(row, 'kickoff_completed_at'),
    updatedAt: text(row, 'updated_at'),
  };
}

const MATCH_COLUMNS = `
  user_id, ea_name, ea_photo_url, ea_video_url,
  ea_experience, ea_languages, ea_tools, ea_strengths, ea_timezone, ea_hours,
  pm_name, pm_email, pm_photo_url,
  match_ready_at, match_accepted_at, match_accepted_ip, match_accepted_ua,
  acceptance_method, declined_at, presentation, reminder_sent_at,
  billing_start_at, stripe_subscription_id, billing_notified_at, client_notified_at,
  kickoff_booked, kickoff_completed_at, updated_at
`;

export async function getMatchByUserId(userId: string): Promise<MatchPackage | null> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT ${MATCH_COLUMNS} FROM match_packages WHERE user_id = ?`,
    args: [userId],
  });
  const row = result.rows[0] as unknown as Row | undefined;
  return row ? mapMatch(row) : null;
}

export async function listClientsForAdmin(nowIso = new Date().toISOString()): Promise<AdminClient[]> {
  const since = new Date(nowIso);
  since.setMonth(since.getMonth() - 12);
  const client = await db();
  const result = await client.execute({
    sql: `
    SELECT
      u.id, u.email, u.full_name, u.plan, u.created_at,
      u.onboarding_completed_at, u.matched_ea_name,
      m.user_id AS match_user_id,
      m.ea_name, m.match_ready_at, m.match_accepted_at,
      m.kickoff_booked, m.kickoff_completed_at,
      m.acceptance_method, m.declined_at, m.presentation, m.billing_start_at,
      (SELECT COUNT(*) FROM match_events e WHERE e.user_id = u.id AND e.kind = 'decline') AS decline_count,
      (SELECT COUNT(*) FROM match_events e WHERE e.user_id = u.id AND e.kind = 'departure') AS departure_count,
      (SELECT COUNT(*) FROM match_events e WHERE e.user_id = u.id AND e.kind = 'rematch' AND e.created_at >= ?) AS rematch_count
    FROM users u
    LEFT JOIN match_packages m ON m.user_id = u.id
    ORDER BY u.created_at DESC
  `,
    args: [since.toISOString()],
  });
  return result.rows.map((row) => {
    const record = row as unknown as Row;
    const plan = text(record, 'plan') === '12' ? '12' : '3';
    return {
      id: text(record, 'id'),
      email: text(record, 'email'),
      fullName: text(record, 'full_name'),
      plan,
      createdAt: text(record, 'created_at'),
      onboardingCompletedAt: text(record, 'onboarding_completed_at'),
      matchedEaName: text(record, 'matched_ea_name').trim().replace(/\s+/g, ' '),
      hasPackage: text(record, 'match_user_id').length > 0,
      eaName: text(record, 'ea_name').trim().replace(/\s+/g, ' '),
      matchReadyAt: text(record, 'match_ready_at'),
      matchAcceptedAt: text(record, 'match_accepted_at'),
      kickoffBooked: Number(record.kickoff_booked) === 1,
      kickoffCompletedAt: text(record, 'kickoff_completed_at'),
      acceptanceMethod: text(record, 'acceptance_method'),
      declinedAt: text(record, 'declined_at'),
      presentation: Number(record.presentation) === 2 ? 2 : 1,
      billingStartAt: text(record, 'billing_start_at'),
      declines: Number(record.decline_count) || 0,
      rematches: Number(record.rematch_count) || 0,
      departures: Number(record.departure_count) || 0,
    };
  });
}

function normalizeImageUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return '';
  if (value.length > 500) return null;
  if (value.startsWith('/') && !value.startsWith('//')) {
    if (value.includes('\\') || /[\s"<>]/.test(value)) return null;
    return value;
  }
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function normalizeHttpUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return '';
  if (value.length > 500) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

function normalizeMultiline(raw: string, max: number): string | null {
  const value = raw.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  if (value.length > max) return null;
  return value;
}

function cleanDraft(draft: MatchDraft, live: boolean): { ok: true; value: MatchDraft } | { ok: false; error: MatchSaveError } {
  const defaults = defaultPartnershipManager();
  const eaSource = draft.eaName.trim().replace(/\s+/g, ' ');
  const pmNameSource = draft.pmName.trim().replace(/\s+/g, ' ') || defaults.name;
  const pmEmailSource = draft.pmEmail.trim() || defaults.email;

  const eaName = eaSource ? normalizeName(eaSource) : '';
  if (eaSource && !eaName) return { ok: false, error: 'name' };
  if ((live || eaName) && eaName && !eaName.includes(' ')) return { ok: false, error: 'name' };
  if (live && (!eaName || !eaName.includes(' '))) return { ok: false, error: 'name' };

  const eaPhotoUrl = normalizeImageUrl(draft.eaPhotoUrl);
  if (eaPhotoUrl === null) return { ok: false, error: 'photo' };
  const pmPhotoUrl = normalizeImageUrl(draft.pmPhotoUrl);
  if (pmPhotoUrl === null) return { ok: false, error: 'photo' };
  const eaVideoUrl = normalizeHttpUrl(draft.eaVideoUrl);
  if (eaVideoUrl === null) return { ok: false, error: 'video' };

  const experience = normalizeMultiline(draft.experience, 2000);
  const languages = normalizeMultiline(draft.languages, 2000);
  const tools = normalizeMultiline(draft.tools, 2000);
  const strengths = normalizeMultiline(draft.strengths, 2000);
  const timezone = normalizeOptional(draft.timezone, 80);
  const hours = normalizeOptional(draft.hours, 160);
  if (
    experience === null ||
    languages === null ||
    tools === null ||
    strengths === null ||
    timezone === null ||
    hours === null
  ) {
    return { ok: false, error: 'fields' };
  }

  const pmName = pmNameSource ? normalizeName(pmNameSource) : '';
  if (pmNameSource && !pmName) return { ok: false, error: 'pm' };
  const pmEmail = pmEmailSource ? normalizeEmail(pmEmailSource) : '';
  if (pmEmailSource && !pmEmail) return { ok: false, error: 'pm' };
  if (live && (!pmName || !pmEmail)) return { ok: false, error: 'pm' };

  return {
    ok: true,
    value: {
      eaName: eaName || '',
      eaPhotoUrl,
      eaVideoUrl,
      experience,
      languages,
      tools,
      strengths,
      timezone: timezone || '',
      hours: hours || '',
      pmName: pmName || '',
      pmEmail: pmEmail || '',
      pmPhotoUrl,
    },
  };
}

const UPSERT_MATCH = `
  INSERT INTO match_packages (
    user_id, ea_name, ea_photo_url, ea_video_url,
    ea_experience, ea_languages, ea_tools, ea_strengths, ea_timezone, ea_hours,
    pm_name, pm_email, pm_photo_url,
    match_ready_at, match_accepted_ip, match_accepted_ua, kickoff_booked, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', 0, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    ea_name = excluded.ea_name,
    ea_photo_url = excluded.ea_photo_url,
    ea_video_url = excluded.ea_video_url,
    ea_experience = excluded.ea_experience,
    ea_languages = excluded.ea_languages,
    ea_tools = excluded.ea_tools,
    ea_strengths = excluded.ea_strengths,
    ea_timezone = excluded.ea_timezone,
    ea_hours = excluded.ea_hours,
    pm_name = excluded.pm_name,
    pm_email = excluded.pm_email,
    pm_photo_url = excluded.pm_photo_url,
    match_ready_at = COALESCE(match_packages.match_ready_at, excluded.match_ready_at),
    updated_at = excluded.updated_at
`;

/**
 * Saves a draft or publishes it. Publishing sets match_ready_at the first time
 * and copies the assistant name onto users.matched_ea_name. A later publish
 * does not move match_ready_at. Acceptance and kickoff fields are left alone.
 */
export async function saveMatchPackage(userId: string, draft: MatchDraft, publish: boolean): Promise<MatchSaveResult> {
  const user = await getUserById(userId);
  if (!user) return { ok: false, error: 'missing' };
  const existing = await getMatchByUserId(userId);
  const live = publish || Boolean(existing?.matchReadyAt);
  const cleaned = cleanDraft(draft, live);
  if (!cleaned.ok) return cleaned;

  const now = new Date().toISOString();
  const readyAt = publish ? now : null;
  const value = cleaned.value;
  if (publish && existing?.declinedAt && !existing.matchAcceptedAt) {
    if (existing.presentation >= 2) return { ok: false, error: 'limit' };
    const client = await db();
    const replaced = await client.execute({
      sql: `UPDATE match_packages SET
        ea_name = ?, ea_photo_url = ?, ea_video_url = ?,
        ea_experience = ?, ea_languages = ?, ea_tools = ?, ea_strengths = ?,
        ea_timezone = ?, ea_hours = ?,
        pm_name = ?, pm_email = ?, pm_photo_url = ?,
        presentation = 2,
        match_ready_at = ?,
        declined_at = NULL,
        reminder_sent_at = NULL,
        match_accepted_at = NULL,
        match_accepted_ip = '',
        match_accepted_ua = '',
        acceptance_method = '',
        kickoff_booked = 0,
        kickoff_completed_at = NULL,
        billing_start_at = NULL,
        stripe_subscription_id = '',
        billing_notified_at = NULL,
        client_notified_at = NULL,
        updated_at = ?
      WHERE user_id = ?
        AND presentation = 1
        AND declined_at IS NOT NULL
        AND length(trim(declined_at)) > 0
        AND (match_accepted_at IS NULL OR length(trim(match_accepted_at)) = 0)`,
      args: [
        value.eaName,
        value.eaPhotoUrl,
        value.eaVideoUrl,
        value.experience,
        value.languages,
        value.tools,
        value.strengths,
        value.timezone,
        value.hours,
        value.pmName,
        value.pmEmail,
        value.pmPhotoUrl,
        now,
        now,
        userId,
      ],
    });
    if (Number(replaced.rowsAffected) !== 1) return { ok: false, error: 'save' };
    await client.execute({
      sql: `UPDATE users SET matched_ea_name = ? WHERE id = ?`,
      args: [value.eaName, userId],
    });
    return { ok: true, eaName: value.eaName, pmName: value.pmName, pmEmail: value.pmEmail };
  }
  const upsert = {
    sql: UPSERT_MATCH,
    args: [
      userId,
      value.eaName,
      value.eaPhotoUrl,
      value.eaVideoUrl,
      value.experience,
      value.languages,
      value.tools,
      value.strengths,
      value.timezone,
      value.hours,
      value.pmName,
      value.pmEmail,
      value.pmPhotoUrl,
      readyAt,
      now,
    ],
  };
  const client = await db();
  if (live && value.eaName) {
    await client.batch(
      [
        upsert,
        {
          sql: `UPDATE users SET matched_ea_name = ? WHERE id = ?`,
          args: [value.eaName, userId],
        },
      ],
      'write',
    );
  } else {
    await client.execute(upsert);
  }
  return { ok: true, eaName: value.eaName, pmName: value.pmName, pmEmail: value.pmEmail };
}

export async function acceptMatch(input: {
  userId: string;
  acceptedAt: string;
  ip: string;
  userAgent: string;
  method: AcceptanceMethod;
}): Promise<'accepted' | 'already' | 'unavailable'> {
  const existing = await getMatchByUserId(input.userId);
  if (!existing?.matchReadyAt || !existing.eaName) return 'unavailable';
  if (existing.declinedAt) return 'unavailable';
  if (existing.matchAcceptedAt) return 'already';
  if (input.method === 'auto') {
    const deadline = addBusinessDays(existing.matchReadyAt, 3);
    const deadlineMs = deadline ? new Date(deadline).getTime() : Number.NaN;
    if (!deadline || new Date(input.acceptedAt).getTime() < deadlineMs) return 'unavailable';
  }
  const billingStart = input.method === 'auto' ? input.acceptedAt : null;
  const client = await db();
  const updated = await client.batch(
    [
      {
        sql: `UPDATE match_packages
          SET match_accepted_at = ?,
              match_accepted_ip = ?,
              match_accepted_ua = ?,
              acceptance_method = ?,
              billing_start_at = COALESCE(billing_start_at, ?),
              updated_at = ?
          WHERE user_id = ?
            AND match_ready_at IS NOT NULL
            AND length(trim(match_ready_at)) > 0
            AND (declined_at IS NULL OR length(trim(declined_at)) = 0)
            AND (match_accepted_at IS NULL OR length(trim(match_accepted_at)) = 0)`,
        args: [
          input.acceptedAt,
          input.ip.slice(0, 80),
          input.userAgent.slice(0, 512),
          input.method,
          billingStart,
          input.acceptedAt,
          input.userId,
        ],
      },
      {
        sql: `UPDATE users SET matched_ea_name = ? WHERE id = ?`,
        args: [existing.eaName, input.userId],
      },
    ],
    'write',
  );
  if (Number(updated[0]?.rowsAffected) === 1) return 'accepted';
  const again = await getMatchByUserId(input.userId);
  if (again?.matchAcceptedAt) return 'already';
  return 'unavailable';
}

export async function markKickoffBooked(userId: string): Promise<boolean> {
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE match_packages
      SET kickoff_booked = 1, updated_at = ?
      WHERE user_id = ?
        AND match_accepted_at IS NOT NULL
        AND length(trim(match_accepted_at)) > 0`,
    args: [new Date().toISOString(), userId],
  });
  return Number(result.rowsAffected) > 0;
}

export async function markOnboardingComplete(userId: string, at: string): Promise<'done' | 'missing'> {
  const user = await getUserById(userId);
  if (!user) return 'missing';
  if (user.onboardingCompletedAt) return 'done';
  const client = await db();
  await client.execute({
    sql: `UPDATE users
      SET onboarding_completed_at = ?
      WHERE id = ?
        AND (onboarding_completed_at IS NULL OR trim(onboarding_completed_at) = '')`,
    args: [at, userId],
  });
  return 'done';
}

export async function markKickoffComplete(userId: string, at: string): Promise<'done' | 'missing' | 'not-accepted'> {
  const existing = await getMatchByUserId(userId);
  if (!existing) return 'missing';
  if (!existing.matchAcceptedAt) return 'not-accepted';
  if (existing.kickoffCompletedAt) return 'done';
  const client = await db();
  await client.execute({
    sql: `UPDATE match_packages
      SET kickoff_completed_at = ?, updated_at = ?
      WHERE user_id = ?
        AND match_accepted_at IS NOT NULL
        AND length(trim(match_accepted_at)) > 0
        AND (kickoff_completed_at IS NULL OR length(trim(kickoff_completed_at)) = 0)`,
    args: [at, at, userId],
  });
  return 'done';
}

export type MatchCounts = { declines: number; rematches: number; departures: number };

export async function matchCounts(userId: string, nowIso = new Date().toISOString()): Promise<MatchCounts> {
  const since = new Date(nowIso);
  since.setMonth(since.getMonth() - 12);
  const client = await db();
  const result = await client.execute({
    sql: `SELECT
      SUM(CASE WHEN kind = 'decline' THEN 1 ELSE 0 END) AS declines,
      SUM(CASE WHEN kind = 'departure' THEN 1 ELSE 0 END) AS departures,
      SUM(CASE WHEN kind = 'rematch' AND created_at >= ? THEN 1 ELSE 0 END) AS rematches
    FROM match_events WHERE user_id = ?`,
    args: [since.toISOString(), userId],
  });
  const row = (result.rows[0] || {}) as unknown as Row;
  return {
    declines: Number(row.declines) || 0,
    rematches: Number(row.rematches) || 0,
    departures: Number(row.departures) || 0,
  };
}

export async function clientCanRequestRematch(userId: string, match: MatchPackage | null): Promise<boolean> {
  if (!match?.matchAcceptedAt || !match.kickoffCompletedAt) return false;
  const counts = await matchCounts(userId);
  return counts.rematches < 1;
}

export type MatchEvent = {
  id: string;
  kind: string;
  eaName: string;
  note: string;
  createdAt: string;
};

export async function listMatchEvents(userId: string): Promise<MatchEvent[]> {
  const client = await db();
  const result = await client.execute({
    sql: `SELECT id, kind, ea_name, note, created_at
      FROM match_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 8`,
    args: [userId],
  });
  return result.rows.map((row) => {
    const record = row as unknown as Row;
    return {
      id: text(record, 'id'),
      kind: text(record, 'kind'),
      eaName: text(record, 'ea_name'),
      note: text(record, 'note'),
      createdAt: text(record, 'created_at'),
    };
  });
}

function blank(value: string): boolean {
  return value.trim().length === 0;
}

export async function declineMatch(input: {
  userId: string;
  at: string;
  note?: string;
}): Promise<'declined' | 'accepted' | 'closed' | 'late' | 'unavailable'> {
  const existing = await getMatchByUserId(input.userId);
  if (!existing?.matchReadyAt || !existing.eaName) return 'unavailable';
  if (existing.matchAcceptedAt) return 'accepted';
  if (existing.declinedAt) return 'declined';
  if (existing.presentation !== 1) return 'closed';
  const deadline = addBusinessDays(existing.matchReadyAt, 3);
  if (!deadline || new Date(input.at).getTime() >= new Date(deadline).getTime()) return 'late';
  const client = await db();
  const updated = await client.execute({
    sql: `UPDATE match_packages
      SET declined_at = ?, updated_at = ?
      WHERE user_id = ?
        AND presentation = 1
        AND (declined_at IS NULL OR length(trim(declined_at)) = 0)
        AND (match_accepted_at IS NULL OR length(trim(match_accepted_at)) = 0)`,
    args: [input.at, input.at, input.userId],
  });
  if (Number(updated.rowsAffected) !== 1) {
    const again = await getMatchByUserId(input.userId);
    if (again?.matchAcceptedAt) return 'accepted';
    if (again?.declinedAt) return 'declined';
    if (again && again.presentation !== 1) return 'closed';
    return 'unavailable';
  }
  const note = (input.note || '').replace(/\s+/g, ' ').trim().slice(0, 1000);
  await client.execute({
    sql: `INSERT INTO match_events (id, user_id, kind, ea_name, note, created_at)
      VALUES (?, ?, 'decline', ?, ?, ?)`,
    args: [crypto.randomUUID(), input.userId, existing.eaName, note, input.at],
  });
  return 'declined';
}

export async function requestRematch(input: {
  userId: string;
  at: string;
  note: string;
}): Promise<'ok' | 'used' | 'unavailable'> {
  const match = await getMatchByUserId(input.userId);
  if (!match?.matchAcceptedAt || !match.kickoffCompletedAt) return 'unavailable';
  const counts = await matchCounts(input.userId, input.at);
  if (counts.rematches >= 1) return 'used';
  const note = input.note.replace(/\s+/g, ' ').trim().slice(0, 1000);
  const client = await db();
  await client.execute({
    sql: `INSERT INTO match_events (id, user_id, kind, ea_name, note, created_at)
      VALUES (?, ?, 'rematch', ?, ?, ?)`,
    args: [crypto.randomUUID(), input.userId, match.eaName, note, input.at],
  });
  return 'ok';
}

export async function markDeparture(input: {
  userId: string;
  at: string;
  note: string;
}): Promise<'ok' | 'missing'> {
  const user = await getUserById(input.userId);
  if (!user) return 'missing';
  const match = await getMatchByUserId(input.userId);
  const eaName = match?.eaName || user.matchedEaName;
  if (!eaName) return 'missing';
  const note = input.note.replace(/\s+/g, ' ').trim().slice(0, 1000);
  const client = await db();
  await client.execute({
    sql: `INSERT INTO match_events (id, user_id, kind, ea_name, note, created_at)
      VALUES (?, ?, 'departure', ?, ?, ?)`,
    args: [crypto.randomUUID(), input.userId, eaName, note, input.at],
  });
  return 'ok';
}

/**
 * Click and email acceptance bill on the earlier of kickoff and three business
 * days after acceptance. Auto acceptance already stores its own start.
 */
export async function openBillingStart(userId: string, nowIso: string): Promise<'set' | 'waiting' | 'ready' | 'missing'> {
  const match = await getMatchByUserId(userId);
  if (!match?.matchAcceptedAt) return 'missing';
  if (!blank(match.billingStartAt)) return 'ready';
  const cap = addBusinessDays(match.matchAcceptedAt, 3);
  if (!cap) return 'missing';
  const capMs = new Date(cap).getTime();
  let start = '';
  if (match.acceptanceMethod === 'auto') {
    start = match.matchAcceptedAt;
  } else if (match.kickoffCompletedAt) {
    const kickoffMs = new Date(match.kickoffCompletedAt).getTime();
    start = !Number.isNaN(kickoffMs) && kickoffMs <= capMs ? match.kickoffCompletedAt : cap;
  } else if (new Date(nowIso).getTime() >= capMs) {
    start = cap;
  } else {
    return 'waiting';
  }
  const client = await db();
  const result = await client.execute({
    sql: `UPDATE match_packages
      SET billing_start_at = ?, updated_at = ?
      WHERE user_id = ?
        AND (billing_start_at IS NULL OR length(trim(billing_start_at)) = 0)`,
    args: [start, nowIso, userId],
  });
  return Number(result.rowsAffected) === 1 ? 'set' : 'ready';
}

async function claimStamp(sql: string, args: Array<string | null>): Promise<boolean> {
  const client = await db();
  const result = await client.execute({ sql, args });
  return Number(result.rowsAffected) === 1;
}

export function claimReminder(userId: string, at: string): Promise<boolean> {
  return claimStamp(
    `UPDATE match_packages SET reminder_sent_at = ?
      WHERE user_id = ?
        AND (reminder_sent_at IS NULL OR length(trim(reminder_sent_at)) = 0)
        AND (match_accepted_at IS NULL OR length(trim(match_accepted_at)) = 0)
        AND (declined_at IS NULL OR length(trim(declined_at)) = 0)`,
    [at, userId],
  );
}

export async function releaseReminder(userId: string, at: string): Promise<void> {
  const client = await db();
  await client.execute({
    sql: `UPDATE match_packages SET reminder_sent_at = NULL WHERE user_id = ? AND reminder_sent_at = ?`,
    args: [userId, at],
  });
}

export function claimClientNotified(userId: string, at: string): Promise<boolean> {
  return claimStamp(
    `UPDATE match_packages SET client_notified_at = ?
      WHERE user_id = ?
        AND (client_notified_at IS NULL OR length(trim(client_notified_at)) = 0)`,
    [at, userId],
  );
}

export async function releaseClientNotified(userId: string, at: string): Promise<void> {
  const client = await db();
  await client.execute({
    sql: `UPDATE match_packages SET client_notified_at = NULL WHERE user_id = ? AND client_notified_at = ?`,
    args: [userId, at],
  });
}

export function claimBillingNotified(userId: string, at: string): Promise<boolean> {
  return claimStamp(
    `UPDATE match_packages SET billing_notified_at = ?
      WHERE user_id = ?
        AND (billing_notified_at IS NULL OR length(trim(billing_notified_at)) = 0)`,
    [at, userId],
  );
}

export async function releaseBillingNotified(userId: string, at: string): Promise<void> {
  const client = await db();
  await client.execute({
    sql: `UPDATE match_packages SET billing_notified_at = NULL WHERE user_id = ? AND billing_notified_at = ?`,
    args: [userId, at],
  });
}

export async function saveSubscription(userId: string, subscriptionId: string): Promise<void> {
  if (!/^sub_[A-Za-z0-9]+$/.test(subscriptionId)) return;
  const client = await db();
  await client.execute({
    sql: `UPDATE match_packages SET stripe_subscription_id = ?, updated_at = ?
      WHERE user_id = ?
        AND (stripe_subscription_id IS NULL OR length(trim(stripe_subscription_id)) = 0)`,
    args: [subscriptionId, new Date().toISOString(), userId],
  });
}

export type MatchWork = MatchPackage & {
  email: string;
  fullName: string;
  plan: PlanCode;
  stripeCustomerId: string;
  defaultPaymentMethodId: string;
};

export async function listMatchWork(): Promise<MatchWork[]> {
  const client = await db();
  const result = await client.execute(`
    SELECT
      m.user_id, m.ea_name, m.ea_photo_url, m.ea_video_url,
      m.ea_experience, m.ea_languages, m.ea_tools, m.ea_strengths, m.ea_timezone, m.ea_hours,
      m.pm_name, m.pm_email, m.pm_photo_url,
      m.match_ready_at, m.match_accepted_at, m.match_accepted_ip, m.match_accepted_ua,
      m.acceptance_method, m.declined_at, m.presentation, m.reminder_sent_at,
      m.billing_start_at, m.stripe_subscription_id, m.billing_notified_at, m.client_notified_at,
      m.kickoff_booked, m.kickoff_completed_at, m.updated_at,
      u.email, u.full_name, u.plan, u.stripe_customer_id, u.default_payment_method_id
    FROM match_packages m
    JOIN users u ON u.id = m.user_id
    WHERE m.match_ready_at IS NOT NULL AND length(trim(m.match_ready_at)) > 0
  `);
  return result.rows.map((row) => {
    const record = row as unknown as Row;
    const plan = text(record, 'plan') === '12' ? '12' : '3';
    return {
      ...mapMatch(record),
      email: text(record, 'email'),
      fullName: text(record, 'full_name'),
      plan,
      stripeCustomerId: text(record, 'stripe_customer_id'),
      defaultPaymentMethodId: text(record, 'default_payment_method_id'),
    };
  });
}
