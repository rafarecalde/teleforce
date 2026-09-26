import { randomUUID } from 'node:crypto';
import { ACK_VERSION } from './constants';
import { db } from './db';
import {
  EA_BILINGUAL,
  EA_FOCUS,
  EA_SCHEDULE,
  EA_START,
  type BilingualCode,
  type FocusCode,
  type StartCode,
} from './ea-request-fields';
import { HttpError } from './http';
import { asRecord } from './validate';

export type EaRequestInput = {
  userId: string;
  focus: FocusCode;
  tasks: string;
  bilingual: BilingualCode;
  startTiming: StartCode;
  notes: string;
};

const TASKS_MAX = 2000;
const NOTES_MAX = 1000;

function choice<T extends string>(raw: unknown, allowed: readonly { value: T }[], message: string): T {
  const value = String(raw ?? '').trim();
  if (allowed.some((item) => item.value === value)) return value as T;
  throw new HttpError(400, message);
}

function textBlock(raw: unknown, max: number): string {
  const value = String(raw ?? '').replace(/\r\n/g, '\n').trim();
  if (value.length > max) throw new HttpError(400, 'That answer is too long.');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
    throw new HttpError(400, 'Check the text and try again.');
  }
  return value;
}

export function parseEaRequest(userId: string, body: unknown): EaRequestInput {
  const record = asRecord(body);
  if (record.acknowledged !== true) {
    throw new HttpError(400, 'Confirm this request before sending.');
  }
  const tasks = textBlock(record.tasks, TASKS_MAX);
  if (!tasks) throw new HttpError(400, 'Describe the talents and tasks you need covered.');
  return {
    userId,
    focus: choice(record.focus, EA_FOCUS, 'Choose a focus for this EA.'),
    tasks,
    bilingual: choice(record.bilingual, EA_BILINGUAL, 'Tell us whether you need English and Spanish.'),
    startTiming: choice(record.startTiming, EA_START, 'Choose a preferred start.'),
    notes: textBlock(record.notes, NOTES_MAX),
  };
}

export async function insertEaRequest(input: EaRequestInput): Promise<{ id: string }> {
  const id = randomUUID();
  const client = await db();
  await client.execute({
    sql: `INSERT INTO ea_requests (
      id, user_id, focus, tasks, bilingual, start_timing, notes, schedule, ack_version, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      input.userId,
      input.focus,
      input.tasks,
      input.bilingual,
      input.startTiming,
      input.notes,
      EA_SCHEDULE,
      ACK_VERSION,
      new Date().toISOString(),
    ],
  });
  return { id };
}
