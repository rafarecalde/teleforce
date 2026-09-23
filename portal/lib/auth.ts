import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_TTL_DAYS, MAGIC_TTL_MIN } from './constants';

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short (need 16+ chars).');
  }
  return new TextEncoder().encode(s);
}

export type Principal = { cid: string; email: string };

// ── magic-link token (single-use intent, 15-min) ────────────────────────────
export async function signMagicToken(p: Principal): Promise<string> {
  return new SignJWT({ email: p.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.cid)
    .setAudience('magic')
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${MAGIC_TTL_MIN}m`)
    .sign(secret());
}

export async function verifyMagicToken(token: string): Promise<Principal | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: 'magic' });
    if (!payload.sub || !payload.email) return null;
    return { cid: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}

// ── session token (7-day, httpOnly cookie) ──────────────────────────────────
export async function signSession(p: Principal): Promise<string> {
  return new SignJWT({ email: p.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.cid)
    .setAudience('session')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret());
}

/** Read + verify the session cookie. Server-signed, so it can't be forged. */
export async function getSession(): Promise<Principal | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: 'session' });
    if (!payload.sub || !payload.email) return null;
    return { cid: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}
