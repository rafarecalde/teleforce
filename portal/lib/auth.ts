import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_TTL_DAYS } from './constants';

// A stable default so the preview runs with zero config. Override AUTH_SECRET for
// anything shared publicly. (This build stores no sensitive data — it's a demo.)
const DEMO_SECRET = 'teleforce-portal-preview-demo-secret-please-override';

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET || DEMO_SECRET);
}

export type Principal = { email: string; name?: string; company?: string };

export async function signSession(p: Principal): Promise<string> {
  return new SignJWT({ email: p.email, name: p.name ?? '', company: p.company ?? '' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(p.email)
    .setAudience('session')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(secret());
}

export async function getSession(): Promise<Principal | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: 'session' });
    if (!payload.email) return null;
    return {
      email: String(payload.email),
      name: payload.name ? String(payload.name) : undefined,
      company: payload.company ? String(payload.company) : undefined,
    };
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
