import { isPlanCode, type PlanCode } from './plans';

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function normalizeName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 120) return null;
  if (/[\u0000-\u001F]/.test(name)) return null;
  return name;
}

export function normalizePlan(raw: string): PlanCode | null {
  const plan = raw.trim();
  return isPlanCode(plan) ? plan : null;
}

export function normalizeOptional(raw: string, max: number): string | null {
  const value = raw.trim().replace(/\s+/g, ' ');
  if (value.length > max) return null;
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) return null;
  return value;
}
