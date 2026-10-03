import { NextResponse } from 'next/server';
import { createAccountSetup } from '@/lib/account-payment';
import { accountError, requireUser } from '@/lib/account-session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const user = await requireUser();
    return NextResponse.json(await createAccountSetup(user));
  } catch (err) {
    return accountError(err, 'Could not start card setup. Try again.');
  }
}
