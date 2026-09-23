import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { notifyOps } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LABELS: Record<string, string> = {
  customer_service: 'Customer service seat',
  sdr: 'SDR seat',
};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const type = String(body?.type ?? '');
  const notes = String(body?.notes ?? '').slice(0, 2000);

  if (!LABELS[type]) {
    return NextResponse.json({ error: 'Unknown request type.' }, { status: 400 });
  }

  // No charge — this is a request for ops to scope and follow up.
  await notifyOps(`Seat request — ${LABELS[type]}`, {
    Customer: `${session.email} (${session.cid})`,
    Type: LABELS[type],
    Notes: notes || '—',
  });

  return NextResponse.json({ ok: true });
}
