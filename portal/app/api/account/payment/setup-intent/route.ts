import { NextResponse } from 'next/server';
import { createAccountSetup, ensureDefaultCard } from '@/lib/account-payment';
import { accountError, requireUser } from '@/lib/account-session';
import { hasCardOnFile } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const user = await requireUser();
    if (hasCardOnFile(user)) {
      await ensureDefaultCard(user);
      return NextResponse.json({
        alreadyOnFile: true,
        brand: user.cardBrand || 'Card',
        last4: user.cardLast4,
      });
    }
    return NextResponse.json(await createAccountSetup(user));
  } catch (err) {
    return accountError(err, 'Could not start card setup. Try again.');
  }
}
