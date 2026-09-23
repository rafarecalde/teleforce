import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken, signSession, sessionCookieOptions } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');
  const token = req.nextUrl.searchParams.get('token') ?? '';

  const principal = await verifyMagicToken(token);
  if (!principal) {
    return NextResponse.redirect(`${base}/?error=link_invalid`);
  }

  const session = await signSession(principal);
  const res = NextResponse.redirect(`${base}/`);
  res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
  return res;
}
