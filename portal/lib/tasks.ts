import { randomBytes, randomUUID } from 'node:crypto';
import { db, isUniqueError } from './db';
import { HttpError } from './http';
import { portalHomeUrl, safeHttpUrl } from './match-terms';
import {
  applyVisibleOrder,
  compareAuto,
  isTaskPriority,
  isTaskStatus,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type CalendarLinks,
  type TaskAuthorRole,
  type TaskBoardData,
  type TaskCommentView,
  type TaskOrderMode,
  type TaskPriority,
  type TaskStatus,
  type TaskView,
} from './task-types';

const TOKEN = /^[A-Za-z0-9_-]{32}$/;
const TITLE_MAX = 140;
const TEXT_MAX = 2000;
const TASK_CAP = 500;

type Row = Record<string, unknown>;

function text(row: Row, key: string): string {
  const value = row[key];
  return value == null ? '' : String(value);
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Calendar date in Eastern time. Overdue uses this, not the server's local zone. */
export function todayNewYork(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isFeedToken(value: string): boolean {
  return TOKEN.test(value);
}

function cleanTitle(raw: string): string {
  const title = raw.trim().replace(/\s+/g, ' ');
  if (!title) throw new HttpError(400, 'Add a title so your EA knows what to pick up.');
  if (title.length > TITLE_MAX) throw new HttpError(400, 'Keep the title under 140 characters.');
  return title;
}

function cleanNotes(raw: string): string {
  const notes = raw.replace(/\r\n/g, '\n').trim();
  if (notes.length > TEXT_MAX) throw new HttpError(400, 'Keep notes under 2,000 characters.');
  return notes;
}

function cleanComment(raw: string): string {
  const body = raw.replace(/\r\n/g, '\n').trim();
  if (!body) throw new HttpError(400, 'Write a comment before sending it.');
  if (body.length > TEXT_MAX) throw new HttpError(400, 'Keep the comment under 2,000 characters.');
  return body;
}

/** Empty is allowed. Anything else must be an http(s) URL without credentials. */
function cleanLink(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  const safe = safeHttpUrl(value);
  if (!safe) throw new HttpError(400, 'Links need to start with http:// or https://.');
  return safe;
}

function cleanDue(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, 'Use a real due date.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new HttpError(400, 'Use a real due date.');
  }
  return value;
}

function asPriority(raw: string, fallback: TaskPriority): TaskPriority {
  const value = raw.trim();
  if (!value) return fallback;
  if (!isTaskPriority(value)) throw new HttpError(400, 'Choose a priority.');
  return value;
}

function asStatus(raw: string, fallback: TaskStatus): TaskStatus {
  const value = raw.trim();
  if (!value) return fallback;
  if (!isTaskStatus(value)) throw new HttpError(400, 'Choose a status.');
  return value;
}

function coercePriority(value: string): TaskPriority {
  return isTaskPriority(value) ? value : 'normal';
}

function coerceStatus(value: string): TaskStatus {
  return isTaskStatus(value) ? value : 'todo';
}

function mapComment(row: Row): TaskCommentView {
  const role = text(row, 'author_role') === 'admin' ? 'admin' : 'client';
  return {
    id: text(row, 'id'),
    authorRole: role,
    authorName: text(row, 'author_name'),
    body: text(row, 'body'),
    createdAt: text(row, 'created_at'),
  };
}

function mapTask(row: Row, comments: TaskCommentView[]): TaskView {
  return {
    id: text(row, 'id'),
    title: text(row, 'title'),
    notes: text(row, 'notes'),
    dueDate: text(row, 'due_date'),
    priority: coercePriority(text(row, 'priority')),
    status: coerceStatus(text(row, 'status')),
    link: text(row, 'link'),
    createdAt: text(row, 'created_at'),
    updatedAt: text(row, 'updated_at'),
    comments,
  };
}

async function orderMode(userId: string): Promise<TaskOrderMode> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT task_order_mode FROM users WHERE id = ?',
    args: [userId],
  });
  return text(result.rows[0] || {}, 'task_order_mode') === 'manual' ? 'manual' : 'auto';
}

async function loadRows(userId: string): Promise<{ tasks: TaskView[]; mode: TaskOrderMode }> {
  const client = await db();
  const mode = await orderMode(userId);
  const [taskResult, commentResult] = await Promise.all([
    client.execute({
      sql: `SELECT id, user_id, title, notes, due_date, priority, link, status, position, created_at, updated_at
            FROM tasks WHERE user_id = ?`,
      args: [userId],
    }),
    client.execute({
      sql: `SELECT id, task_id, author_role, author_name, body, created_at
            FROM task_comments WHERE user_id = ? ORDER BY created_at ASC`,
      args: [userId],
    }),
  ]);
  const comments = new Map<string, TaskCommentView[]>();
  for (const row of commentResult.rows) {
    const taskId = text(row, 'task_id');
    const list = comments.get(taskId) || [];
    list.push(mapComment(row));
    comments.set(taskId, list);
  }
  const today = todayNewYork();
  const withPosition = taskResult.rows.map((row) => ({
    position: Number(row.position) || 0,
    task: mapTask(row, comments.get(text(row, 'id')) || []),
  }));
  withPosition.sort((a, b) => {
    if (mode === 'manual') {
      if (a.position !== b.position) return a.position - b.position;
      if (a.task.createdAt !== b.task.createdAt) return a.task.createdAt < b.task.createdAt ? -1 : 1;
      return a.task.id < b.task.id ? -1 : 1;
    }
    const byAuto = compareAuto(a.task, b.task, today);
    if (byAuto !== 0) return byAuto;
    return a.task.id < b.task.id ? -1 : 1;
  });
  return { tasks: withPosition.map((item) => item.task), mode };
}

function subscribeUrl(token: string): string {
  const home = new URL(portalHomeUrl());
  const webcal = `webcal://${home.host}/api/calendar/${token}`;
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
}

async function ensureFeeds(userId: string): Promise<CalendarLinks> {
  const client = await db();
  const existing = await client.execute({
    sql: 'SELECT client_token, ea_token FROM task_calendar_feeds WHERE user_id = ?',
    args: [userId],
  });
  const row = existing.rows[0];
  if (row) {
    return {
      clientSubscribeUrl: subscribeUrl(text(row, 'client_token')),
      eaSubscribeUrl: subscribeUrl(text(row, 'ea_token')),
    };
  }
  let clientToken = randomBytes(24).toString('base64url');
  let eaToken = randomBytes(24).toString('base64url');
  if (clientToken === eaToken) eaToken = randomBytes(24).toString('base64url');
  try {
    await client.execute({
      sql: `INSERT INTO task_calendar_feeds (user_id, client_token, ea_token, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [userId, clientToken, eaToken, nowIso()],
    });
  } catch (err) {
    if (!isUniqueError(err)) throw err;
    const again = await client.execute({
      sql: 'SELECT client_token, ea_token FROM task_calendar_feeds WHERE user_id = ?',
      args: [userId],
    });
    const saved = again.rows[0];
    if (!saved) throw err;
    clientToken = text(saved, 'client_token');
    eaToken = text(saved, 'ea_token');
  }
  return {
    clientSubscribeUrl: subscribeUrl(clientToken),
    eaSubscribeUrl: subscribeUrl(eaToken),
  };
}

export async function loadTaskBoard(userId: string): Promise<TaskBoardData> {
  const feeds = await ensureFeeds(userId);
  const loaded = await loadRows(userId);
  return {
    tasks: loaded.tasks,
    mode: loaded.mode,
    feeds,
    today: todayNewYork(),
  };
}

async function nextPosition(userId: string): Promise<number> {
  const client = await db();
  const result = await client.execute({
    sql: 'SELECT COALESCE(MAX(position), -1) AS max_pos FROM tasks WHERE user_id = ?',
    args: [userId],
  });
  return Number(result.rows[0]?.max_pos ?? -1) + 1;
}

export type NewTaskInput = {
  title: string;
  notes?: string;
  dueDate?: string;
  priority?: string;
  link?: string;
};

export async function createTask(userId: string, input: NewTaskInput): Promise<TaskBoardData> {
  const client = await db();
  const count = await client.execute({
    sql: 'SELECT COUNT(*) AS n FROM tasks WHERE user_id = ?',
    args: [userId],
  });
  if (Number(count.rows[0]?.n || 0) >= TASK_CAP) {
    throw new HttpError(400, 'This list is full. Mark a few done, or ask your Partnership Manager.');
  }
  const title = cleanTitle(input.title);
  const notes = cleanNotes(input.notes || '');
  const dueDate = cleanDue(input.dueDate || '');
  const priority = asPriority(input.priority || '', 'normal');
  const link = cleanLink(input.link || '');
  const stamp = nowIso();
  await client.execute({
    sql: `INSERT INTO tasks (
            id, user_id, title, notes, due_date, priority, link, status, position, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'todo', ?, ?, ?)`,
    args: [randomUUID(), userId, title, notes, dueDate, priority, link, await nextPosition(userId), stamp, stamp],
  });
  return loadTaskBoard(userId);
}

export type TaskPatch = {
  title?: string;
  notes?: string;
  dueDate?: string;
  priority?: string;
  link?: string;
  status?: string;
};

export async function updateTask(userId: string, taskId: string, patch: TaskPatch): Promise<TaskBoardData | null> {
  const client = await db();
  const current = await client.execute({
    sql: 'SELECT title, notes, due_date, priority, link, status FROM tasks WHERE id = ? AND user_id = ?',
    args: [taskId, userId],
  });
  const row = current.rows[0];
  if (!row) return null;
  const title = patch.title === undefined ? text(row, 'title') : cleanTitle(patch.title);
  const notes = patch.notes === undefined ? text(row, 'notes') : cleanNotes(patch.notes);
  const dueDate = patch.dueDate === undefined ? text(row, 'due_date') : cleanDue(patch.dueDate);
  const priority = patch.priority === undefined ? coercePriority(text(row, 'priority')) : asPriority(patch.priority, 'normal');
  const link = patch.link === undefined ? text(row, 'link') : cleanLink(patch.link);
  const status = patch.status === undefined ? coerceStatus(text(row, 'status')) : asStatus(patch.status, 'todo');
  await client.execute({
    sql: `UPDATE tasks
          SET title = ?, notes = ?, due_date = ?, priority = ?, link = ?, status = ?, updated_at = ?
          WHERE id = ? AND user_id = ?`,
    args: [title, notes, dueDate, priority, link, status, nowIso(), taskId, userId],
  });
  return loadTaskBoard(userId);
}

export async function addTaskComment(
  userId: string,
  taskId: string,
  authorRole: TaskAuthorRole,
  authorName: string,
  body: string,
): Promise<TaskBoardData | null> {
  const client = await db();
  const task = await client.execute({
    sql: 'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
    args: [taskId, userId],
  });
  if (!task.rows[0]) return null;
  const count = await client.execute({
    sql: 'SELECT COUNT(*) AS n FROM task_comments WHERE task_id = ?',
    args: [taskId],
  });
  if (Number(count.rows[0]?.n || 0) >= 200) {
    throw new HttpError(400, 'This thread is full. Start the next detail on a new task.');
  }
  const name = authorName.trim().replace(/\s+/g, ' ').slice(0, 120) || (authorRole === 'admin' ? 'Your EA' : 'You');
  await client.execute({
    sql: `INSERT INTO task_comments (id, task_id, user_id, author_role, author_name, body, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [randomUUID(), taskId, userId, authorRole, name, cleanComment(body), nowIso()],
  });
  return loadTaskBoard(userId);
}

/** Visible ids are written into the slots they already occupy. The rest stay put. */
export async function reorderTasks(userId: string, visibleIds: string[]): Promise<TaskBoardData> {
  const loaded = await loadRows(userId);
  const next = applyVisibleOrder(loaded.tasks, visibleIds);
  if (!next) throw new HttpError(400, 'That order didn’t match the list. Refresh and try again.');
  const client = await db();
  const tx = await client.transaction('write');
  try {
    await tx.execute({
      sql: `UPDATE users SET task_order_mode = 'manual' WHERE id = ?`,
      args: [userId],
    });
    for (let i = 0; i < next.length; i += 1) {
      await tx.execute({
        sql: 'UPDATE tasks SET position = ? WHERE id = ? AND user_id = ?',
        args: [i, next[i].id, userId],
      });
    }
    await tx.commit();
  } catch (err) {
    try {
      await tx.rollback();
    } catch {
      // The failed transaction may already be closed.
    }
    throw err;
  }
  return loadTaskBoard(userId);
}

export async function resetTaskOrder(userId: string): Promise<TaskBoardData> {
  const client = await db();
  await client.execute({
    sql: `UPDATE users SET task_order_mode = 'auto' WHERE id = ?`,
    args: [userId],
  });
  return loadTaskBoard(userId);
}

function icsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldLine(line: string): string {
  const parts: string[] = [];
  let rest = line;
  let limit = 75;
  while (Buffer.byteLength(rest) > limit) {
    let cut = 0;
    let bytes = 0;
    for (const ch of rest) {
      const size = Buffer.byteLength(ch);
      if (bytes + size > limit) break;
      bytes += size;
      cut += ch.length;
    }
    if (cut === 0) break;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
    limit = 74;
  }
  parts.push(rest);
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join('\r\n');
}

function icsStamp(iso: string): string {
  const date = new Date(iso);
  const value = Number.isNaN(date.getTime()) ? new Date() : date;
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function compactDate(ymd: string): string {
  return ymd.replace(/-/g, '');
}

function nextDate(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const ICS_PRIORITY: Record<TaskPriority, number> = {
  urgent: 1,
  high: 3,
  normal: 5,
  low: 7,
};

function eventLines(task: TaskView, stamp: string): string[] {
  const description = [
    task.notes,
    `Status: ${STATUS_LABEL[task.status]}`,
    `Priority: ${PRIORITY_LABEL[task.priority]}`,
    task.link,
  ].filter(Boolean).join('\n');
  const lines = [
    'BEGIN:VEVENT',
    `UID:${task.id}@portal.tryteleforce.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compactDate(task.dueDate)}`,
    `DTEND;VALUE=DATE:${nextDate(task.dueDate)}`,
    `SUMMARY:${icsText(task.title)}`,
    `DESCRIPTION:${icsText(description)}`,
    `STATUS:${task.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`,
    `PRIORITY:${ICS_PRIORITY[task.priority]}`,
    `LAST-MODIFIED:${icsStamp(task.updatedAt)}`,
    `SEQUENCE:${Math.floor(Date.parse(task.updatedAt) / 1000) || 0}`,
    'TRANSP:TRANSPARENT',
    'CLASS:PRIVATE',
  ];
  if (task.link.startsWith('http://') || task.link.startsWith('https://')) lines.push(`URL:${task.link}`);
  lines.push('END:VEVENT');
  return lines;
}

function calendarName(audience: 'client' | 'ea', fullName: string): string {
  if (audience === 'client') return 'Teleforce tasks';
  const who = fullName.trim().replace(/\s+/g, ' ').slice(0, 80);
  return who ? `Teleforce tasks · ${who}` : 'Teleforce tasks';
}

/** ICS for a client or EA token. Null when the token is unknown. Due dates only. */
export async function icsForToken(token: string): Promise<string | null> {
  if (!isFeedToken(token)) return null;
  const client = await db();
  let audience: 'client' | 'ea' = 'client';
  let found = await client.execute({
    sql: `SELECT f.user_id, u.full_name
          FROM task_calendar_feeds f
          JOIN users u ON u.id = f.user_id
          WHERE f.client_token = ?`,
    args: [token],
  });
  if (!found.rows[0]) {
    audience = 'ea';
    found = await client.execute({
      sql: `SELECT f.user_id, u.full_name
            FROM task_calendar_feeds f
            JOIN users u ON u.id = f.user_id
            WHERE f.ea_token = ?`,
      args: [token],
    });
  }
  const row = found.rows[0];
  if (!row) return null;
  const userId = text(row, 'user_id');
  const loaded = await loadRows(userId);
  const stamp = icsStamp(nowIso());
  const events = loaded.tasks
    .filter((task) => task.dueDate)
    .flatMap((task) => eventLines(task, stamp));
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Teleforce//Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(calendarName(audience, text(row, 'full_name')))}`,
    'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
    ...events,
    'END:VCALENDAR',
  ];
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
