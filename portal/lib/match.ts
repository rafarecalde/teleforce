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
  kickoffBooked: boolean;
  kickoffCompletedAt: string;
  updatedAt: string;
};

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

export type MatchSaveError = 'missing' | 'name' | 'photo' | 'video' | 'pm' | 'fields';

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

export function describeMatch(row: Pick<AdminClient, 'hasPackage' | 'matchedEaName' | 'eaName' | 'matchReadyAt' | 'matchAcceptedAt' | 'kickoffBooked' | 'kickoffCompletedAt'>): string {
  const name = row.eaName || row.matchedEaName;
  const withName = (label: string) => (name ? `${label} · ${name}` : label);
  if (row.kickoffCompletedAt) return withName('Kickoff done');
  if (row.matchAcceptedAt) return withName(row.kickoffBooked ? 'Accepted, kickoff booked' : 'Accepted');
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

export async function listClientsForAdmin(): Promise<AdminClient[]> {
  const client = await db();
  const result = await client.execute(`
    SELECT
      u.id, u.email, u.full_name, u.plan, u.created_at,
      u.onboarding_completed_at, u.matched_ea_name,
      m.user_id AS match_user_id,
      m.ea_name, m.match_ready_at, m.match_accepted_at,
      m.kickoff_booked, m.kickoff_completed_at
    FROM users u
    LEFT JOIN match_packages m ON m.user_id = u.id
    ORDER BY u.created_at DESC
  `);
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
}): Promise<'accepted' | 'already' | 'unavailable'> {
  const existing = await getMatchByUserId(input.userId);
  if (!existing?.matchReadyAt || !existing.eaName) return 'unavailable';
  if (existing.matchAcceptedAt) return 'already';
  const client = await db();
  const updated = await client.batch(
    [
      {
        sql: `UPDATE match_packages
          SET match_accepted_at = ?,
              match_accepted_ip = ?,
              match_accepted_ua = ?,
              updated_at = ?
          WHERE user_id = ?
            AND match_ready_at IS NOT NULL
            AND length(trim(match_ready_at)) > 0
            AND (match_accepted_at IS NULL OR length(trim(match_accepted_at)) = 0)`,
        args: [input.acceptedAt, input.ip, input.userAgent, input.acceptedAt, input.userId],
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
