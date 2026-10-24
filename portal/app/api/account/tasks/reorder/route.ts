import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { reorderTasks } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const ids = body && typeof body === 'object' && Array.isArray((body as { ids?: unknown }).ids)
      ? (body as { ids: unknown[] }).ids.filter((id): id is string => typeof id === 'string')
      : [];
    return NextResponse.json(await reorderTasks(user.id, ids));
  } catch (err) {
    return accountError(err, 'Couldn’t save that order. Try again.');
  }
}
