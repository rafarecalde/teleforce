import { NextRequest, NextResponse } from 'next/server';
import { signSession, sessionCookieOptions } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Preview sign-in: no verification (demo data only). If PORTAL_PASSCODE is set,
// it must match. Accepts a form POST or JSON.
export async function POST(req: NextRequest) {
  const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');

  let email = '';
  let name = '';
  let company = '';
  let passcode = '';

  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const b = await req.json().catch(() => ({}));
    email = String(b?.email ?? '');
    name = String(b?.name ?? '');
    company = String(b?.company ?? '');
    passcode = String(b?.passcode ?? '');
  } else {
    const f = await req.formData();
    email = String(f.get('email') ?? '');
    name = String(f.get('name') ?? '');
    company = String(f.get('company') ?? '');
    passcode = String(f.get('passcode') ?? '');
  }

  email = email.trim();
  const required = process.env.PORTAL_PASSCODE;
  if (required && passcode.trim() !== required) {
    return NextResponse.redirect(`${base}/?error=passcode`, { status: 303 });
  }
  if (!email) {
    return NextResponse.redirect(`${base}/?error=email`, { status: 303 });
  }

  const token = await signSession({
    email,
    name: name.trim() || undefined,
    company: company.trim() || undefined,
  });
  const res = NextResponse.redirect(`${base}/`, { status: 303 });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
