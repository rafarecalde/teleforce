import { NextRequest, NextResponse } from 'next/server';
import { sessionCookieOptions } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');
  const res = NextResponse.redirect(`${base}/`, { status: 303 });
  res.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return res;
}
