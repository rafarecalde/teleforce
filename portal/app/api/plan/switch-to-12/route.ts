import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { stripe, subPrice } from '@/lib/stripe';
import { ACK_VERSION } from '@/lib/constants';
import { addMonthsISO, formatMoney } from '@/lib/money';
import { sendSwitchConfirmation, notifyOps } from '@/lib/email';
import { clientIp } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const subscriptionId = String(body?.subscriptionId ?? '');
  const ack = body?.ack === true;

  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscription.' }, { status: 400 });
  }
  if (!ack) {
    return NextResponse.json({ error: 'Please check the acknowledgment box first.' }, { status: 400 });
  }

  const price12Id = process.env.STRIPE_PRICE_12MO;
  if (!price12Id) {
    return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  }

  // Re-derive from the session; verify the subscription belongs to this customer.
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
  if (sub.customer !== session.cid) {
    return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 });
  }
  if ((sub.metadata?.term ?? '') !== '3') {
    return NextResponse.json({ error: 'This plan is not on a 3-month term.' }, { status: 400 });
  }

  const item = sub.items.data[0];
  if (!item) {
    return NextResponse.json({ error: 'Subscription has no items.' }, { status: 400 });
  }

  const now = new Date();
  const commitmentEnd = addMonthsISO(12, now);
  const ip = clientIp(req.headers);

  // Idempotency: repeated confirms for the same sub + ack version are a no-op.
  const updated = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: [{ id: item.id, price: price12Id }],
      proration_behavior: 'none', // no proration on the switch
      // billing_cycle_anchor is intentionally omitted → the existing cycle is kept.
      metadata: {
        ...sub.metadata,
        term: '12',
        commitment_end: commitmentEnd,
        amend_ack_at: now.toISOString(),
        amend_ack_ip: ip,
        amend_ack_version: ACK_VERSION,
        amend_ack_email: session.email,
      },
    },
    { idempotencyKey: `switch12:${subscriptionId}:${ACK_VERSION}` },
  );

  const price = subPrice(updated);
  const rate = formatMoney(price?.unit_amount, price?.currency ?? 'usd');
  const eaName = updated.metadata?.ea_name ?? sub.metadata?.ea_name ?? null;

  // Emails (best-effort; the amendment already succeeded).
  try {
    await sendSwitchConfirmation(session.email, { eaName, commitmentEnd, rate });
    await notifyOps('Plan switched to 12-month', {
      Customer: `${session.email} (${session.cid})`,
      Subscription: subscriptionId,
      'EA name': eaName ?? '—',
      'New rate': `${rate}/mo`,
      'Commitment end': commitmentEnd,
      'Ack version': ACK_VERSION,
      'Ack IP': ip,
    });
  } catch (e) {
    console.error('switch email error:', e);
  }

  return NextResponse.json({ ok: true, commitmentEnd, rate });
}
