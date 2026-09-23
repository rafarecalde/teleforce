import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Opens Stripe's hosted Billing Portal. The configuration (created via
// `npm run setup:portal`) restricts it to payment-method + invoices and
// DISABLES cancellation and plan switching.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(
      `${(process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '')}/`,
      { status: 303 },
    );
  }

  const base = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, '');
  const portal = await stripe.billingPortal.sessions.create({
    customer: session.cid,
    return_url: `${base}/`,
    ...(process.env.STRIPE_PORTAL_CONFIGURATION_ID
      ? { configuration: process.env.STRIPE_PORTAL_CONFIGURATION_ID }
      : {}),
  });

  return NextResponse.redirect(portal.url, { status: 303 });
}
