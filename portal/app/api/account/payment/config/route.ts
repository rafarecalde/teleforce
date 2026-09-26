import { NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { publishableKey } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json({ publishableKey: publishableKey() });
  } catch (err) {
    return accountError(err, 'Card form is not configured yet.');
  }
}
