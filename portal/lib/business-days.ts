/** Business days are Monday–Friday in America/New_York. Holidays are not skipped. */

const NEW_YORK = 'America/New_York';

type Wall = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function wall(date: Date): Wall {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const bag: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) bag[part.type] = part.value;
  let year = Number(bag.year);
  let month = Number(bag.month);
  let day = Number(bag.day);
  let hour = Number(bag.hour);
  if (hour === 24) {
    hour = 0;
    const next = addCalendarDay(year, month, day);
    year = next.year;
    month = next.month;
    day = next.day;
  }
  return {
    year,
    month,
    day,
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

function addCalendarDay(year: number, month: number, day: number): { year: number; month: number; day: number } {
  const utc = new Date(Date.UTC(year, month - 1, day + 1));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

function weekday(year: number, month: number, day: number): string {
  const probe = new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
  return new Intl.DateTimeFormat('en-US', { timeZone: NEW_YORK, weekday: 'short' }).format(probe);
}

/** Milliseconds to add to a UTC instant to get the New York wall clock read as UTC. */
function offsetMs(instant: Date): number {
  const parts = wall(instant);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - instant.getTime();
}

function wallToUtc(parts: Wall): Date {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const adjusted = guess - offsetMs(new Date(guess));
  return new Date(guess - offsetMs(new Date(adjusted)));
}

/** Same clock time, `days` weekdays later. Empty string when `iso` is not a date. */
export function addBusinessDays(iso: string, days: number): string {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime()) || days < 0 || !Number.isInteger(days)) return '';
  const parts = wall(start);
  let cursor = { year: parts.year, month: parts.month, day: parts.day };
  let left = days;
  let guard = 0;
  while (left > 0 && guard < 40) {
    cursor = addCalendarDay(cursor.year, cursor.month, cursor.day);
    const name = weekday(cursor.year, cursor.month, cursor.day);
    if (name !== 'Sat' && name !== 'Sun') left -= 1;
    guard += 1;
  }
  if (left > 0) return '';
  return wallToUtc({
    year: cursor.year,
    month: cursor.month,
    day: cursor.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  }).toISOString();
}

/** "Wednesday, October 28 at 3:00 PM ET". */
export function formatNewYork(iso: string): string {
  const date = new Date(iso);
  if (!iso || Number.isNaN(date.getTime())) return '';
  const datePart = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('en-US', {
    timeZone: NEW_YORK,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
  return `${datePart} at ${timePart} ET`;
}

export function deadlineFrom(readyAt: string): string {
  if (!readyAt.trim()) return '';
  return addBusinessDays(readyAt, 3);
}

export function formatDeadline(readyAt: string): string {
  return formatNewYork(deadlineFrom(readyAt));
}
