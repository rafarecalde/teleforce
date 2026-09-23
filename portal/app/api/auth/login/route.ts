import { NextRequest, NextResponse } from 'next/server';
import { getCustomerByEmail } from '@/lib/stripe';
import { signMagicToken } from '@/lib/auth';
import { sendMagicLink } from '@/lib/email';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { RL_WINDOW_MS, RL_PER_EMAIL, RL_PER_IP } from '@/lib/constants';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Same response whether or not an account exists (no account enumeration).
const NEUTRAL = {
  message: "If an account matches that email, we've sent a sign-in link. Check your inbox.",
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  let email = '';
  try {
    const body = await req.json();
    email = String(body?.email ?? '').toLowerCase().trim();
  } catch {
    /* ignore */
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const ipOk = rateLimit(`login:ip:${ip}`, RL_PER_IP, RL_WINDOW_MS);
  const emailOk = rateLimit(`login:email:${email}`, RL_PER_EMAIL, RL_WINDOW_MS);
  if (!ipOk.ok || !emailOk.ok) {
    // Neutral message, but signal throttling.
    return NextResponse.json(NEUTRAL, {
      status: 429,
      headers: { 'Retry-After': String(Math.max(ipOk.retryAfter, emailOk.retryAfter)) },
    });
  }

  try {
    const customer = await getCustomerByEmail(email);
    if (customer) {
      const token = await signMagicToken({ cid: customer.id, email });
      const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');
      const link = `${base}/api/auth/callback?token=${encodeURIComponent(token)}`;
      await sendMagicLink(email, link);
    }
    // If no customer: send nothing, return the same neutral message.
  } catch (err) {
    console.error('login error:', err);
    // Still neutral — don't leak whether the address exists or a service failed.
  }

  return NextResponse.json(NEUTRAL, { status: 200 });
}
