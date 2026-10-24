import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { updateTask, type TaskPatch } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function patch(body: unknown): TaskPatch {
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const out: TaskPatch = {};
  for (const key of ['title', 'notes', 'dueDate', 'priority', 'link', 'status'] as const) {
    if (typeof record[key] === 'string') out[key] = String(record[key]);
  }
  return out;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    if (!UUID.test(params.id)) return NextResponse.json({ error: 'That task was not found.' }, { status: 404 });
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    const saved = await updateTask(user.id, params.id, patch(body));
    if (!saved) return NextResponse.json({ error: 'That task was not found.' }, { status: 404 });
    return NextResponse.json(saved);
  } catch (err) {
    return accountError(err, 'Couldn’t update that task. Try again.');
  }
}
