import { NextRequest, NextResponse } from 'next/server';
import { signSession, sessionCookieOptions } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/constants';
import { verifyPassword } from '@/lib/password';
import { getUserByEmail } from '@/lib/users';
import { normalizeEmail } from '@/lib/validate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function redirectTo(base: string, error?: string, next?: string) {
  const tasks = next === 'tasks';
  if (error) {
    const hash = tasks ? '#tasks' : '';
    return NextResponse.redirect(`${base}/?error=${encodeURIComponent(error)}${hash}`, { status: 303 });
  }
  return NextResponse.redirect(tasks ? `${base}/#tasks` : `${base}/`, { status: 303 });
}

export async function POST(req: NextRequest) {
  const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');

  let email = '';
  let password = '';
  let next = '';
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      email = String(body?.email ?? '');
      password = String(body?.password ?? '');
      next = String(body?.next ?? '');
    } else {
      const form = await req.formData();
      email = String(form.get('email') ?? '');
      password = String(form.get('password') ?? '');
      next = String(form.get('next') ?? '');
    }
  } catch {
    return redirectTo(base, 'credentials');
  }
  if (next !== 'tasks') next = '';

  const normalized = normalizeEmail(email);
  if (!normalized || !password) return redirectTo(base, 'credentials', next);

  try {
    const user = await getUserByEmail(normalized);
    const ok = await verifyPassword(password, user?.passwordHash);
    if (!user || !ok) return redirectTo(base, 'credentials', next);

    const token = await signSession({
      userId: user.id,
      email: user.email,
      name: user.fullName,
    });
    const res = redirectTo(base, undefined, next);
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error('login failed', err instanceof Error ? err.message : 'error');
    return redirectTo(base, 'unavailable', next);
  }
}
