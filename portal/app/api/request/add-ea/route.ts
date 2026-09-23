import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { notifyOps, sendAddEaConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const s = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = s(body?.name);
  const email = s(body?.email);
  const title = s(body?.title);
  const timezone = s(body?.timezone);
  const start = s(body?.start);
  const notes = s(body?.notes, 2000);
  const ack = body?.ack === true;

  if (!name) {
    return NextResponse.json({ error: "Enter the executive's name." }, { status: 400 });
  }
  if (!ack) {
    return NextResponse.json({ error: 'Please check the acknowledgment box first.' }, { status: 400 });
  }

  // No Stripe charge — ops creates the subscription at kickoff.
  await notifyOps('Additional EA requested', {
    Customer: `${session.email} (${session.cid})`,
    'Executive name': name,
    'Executive email': email || '—',
    Title: title || '—',
    'Time zone': timezone || '—',
    'Preferred start': start || '—',
    Notes: notes || '—',
  });

  try {
    await sendAddEaConfirmation(session.email, { name, start });
  } catch (e) {
    console.error('add-ea confirmation email error:', e);
  }

  return NextResponse.json({ ok: true });
}
