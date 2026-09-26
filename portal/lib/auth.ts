import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, SESSION_TTL_DAYS } from './constants';

const DEV_SECRET = 'teleforce-portal-dev-only-secret-not-for-production';

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (value) return new TextEncoder().encode(value);
  const building = process.env.NEXT_PHASE === 'phase-production-build';
  if (process.env.NODE_ENV === 'production' && !building) {
    throw new Error('AUTH_SECRET is required in production');
  }
  return new TextEncoder().encode(DEV_SECRET);
}

export type Principal = { userId: string; email: string; name: string };

export async function signSession(principal: Principal): Promise<string> {
  return new SignJWT({
    email: principal.email,
    name: principal.name,
    userId: principal.userId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(principal.userId)
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
    const userId = payload.userId ? String(payload.userId) : '';
    const email = payload.email ? String(payload.email) : '';
    if (!userId || !email) return null;
    return {
      userId,
      email,
      name: payload.name ? String(payload.name) : '',
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
