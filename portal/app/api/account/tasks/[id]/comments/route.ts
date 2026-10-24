import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { addTaskComment } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (!UUID.test(params.id)) return NextResponse.json({ error: 'That task was not found.' }, { status: 404 });
    const body = await req.json().catch(() => null);
    const text = body && typeof body === 'object' && typeof (body as { body?: unknown }).body === 'string'
      ? String((body as { body: string }).body)
      : '';
    const name = user.fullName.trim() || 'You';
    const saved = await addTaskComment(user.id, params.id, 'client', name, text);
    if (!saved) return NextResponse.json({ error: 'That task was not found.' }, { status: 404 });
    return NextResponse.json(saved);
  } catch (err) {
    return accountError(err, 'Couldn’t add that comment. Try again.');
  }
}
