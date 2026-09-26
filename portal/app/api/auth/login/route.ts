import { NextRequest, NextResponse } from 'next/server';
import { signSession, sessionCookieOptions } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/constants';
import { verifyPassword } from '@/lib/password';
import { getUserByEmail } from '@/lib/users';
import { normalizeEmail } from '@/lib/validate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function redirectTo(base: string, error?: string) {
  const url = error ? `${base}/?error=${encodeURIComponent(error)}` : `${base}/`;
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');

  let email = '';
  let password = '';
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      email = String(body?.email ?? '');
      password = String(body?.password ?? '');
    } else {
      const form = await req.formData();
      email = String(form.get('email') ?? '');
      password = String(form.get('password') ?? '');
    }
  } catch {
    return redirectTo(base, 'credentials');
  }

  const normalized = normalizeEmail(email);
  if (!normalized || !password) return redirectTo(base, 'credentials');

  try {
    const user = await getUserByEmail(normalized);
    const ok = await verifyPassword(password, user?.passwordHash);
    if (!user || !ok) return redirectTo(base, 'credentials');

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.fullName,
    });
    const res = redirectTo(base);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error('login failed', err instanceof Error ? err.message : 'error');
    return redirectTo(base, 'unavailable');
  }
}
