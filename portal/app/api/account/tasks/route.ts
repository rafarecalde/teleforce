import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { createTask, loadTaskBoard, type NewTaskInput } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function input(body: unknown): NewTaskInput {
  const record = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const str = (key: string) => (typeof record[key] === 'string' ? String(record[key]) : '');
  return {
    title: str('title'),
    notes: str('notes'),
    dueDate: str('dueDate'),
    priority: str('priority'),
    link: str('link'),
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await loadTaskBoard(user.id));
  } catch (err) {
    return accountError(err, 'Couldn’t load tasks. Try again.');
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    return NextResponse.json(await createTask(user.id, input(body)));
  } catch (err) {
    return accountError(err, 'Couldn’t save that task. Try again.');
  }
}
