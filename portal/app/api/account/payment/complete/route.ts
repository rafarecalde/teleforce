import { NextRequest, NextResponse } from 'next/server';
import { saveAccountPaymentMethod } from '@/lib/account-payment';
import { accountError, requireUser } from '@/lib/account-session';
import { asRecord } from '@/lib/validate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const setupIntentId = String(asRecord(body).setupIntentId ?? '');
    const card = await saveAccountPaymentMethod(user, setupIntentId);
    return NextResponse.json({ ok: true, brand: card.brand, last4: card.last4 });
  } catch (err) {
    return accountError(err, 'Could not save the card. Try again.');
  }
}
