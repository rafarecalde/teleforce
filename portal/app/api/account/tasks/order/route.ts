import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { resetTaskOrder } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const mode = body && typeof body === 'object' ? String((body as { mode?: unknown }).mode || '') : '';
    if (mode !== 'auto') return NextResponse.json({ error: 'That order isn’t available.' }, { status: 400 });
    return NextResponse.json(await resetTaskOrder(user.id));
  } catch (err) {
    return accountError(err, 'Couldn’t restore the suggested order. Try again.');
  }
}
