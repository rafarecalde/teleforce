import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { eaCanAccessClient } from '@/lib/ea';
import { appRedirect, HttpError } from '@/lib/http';
import { isUserId } from '@/lib/match';
import { addTaskComment, updateTask } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const session = await getSession();
  if (!session || session.role !== 'ea') return back('/');

  const form = await req.formData().catch(() => null);
  const userId = String(form?.get('userId') ?? '');
  const taskId = String(form?.get('taskId') ?? '');
  const intent = String(form?.get('intent') ?? '');
  const list = isUserId(userId) ? `/ea/${userId}` : '/ea';
  if (!isUserId(userId) || !UUID.test(taskId)) return back('/ea?error=missing');
  if (!(await eaCanAccessClient(session.userId, userId))) return back('/ea?error=missing');

  try {
    if (intent === 'status' || intent === 'done') {
      const status = intent === 'done' ? 'done' : String(form?.get('status') ?? '');
      const saved = await updateTask(userId, taskId, { status });
      if (!saved) return back(`${list}?error=task`);
    } else if (intent === 'comment') {
      const saved = await addTaskComment(userId, taskId, 'admin', session.name || 'Your EA', String(form?.get('body') ?? ''));
      if (!saved) return back(`${list}?error=task`);
    } else {
      return back(`${list}?error=task`);
    }
  } catch (err) {
    if (err instanceof HttpError) return back(`${list}?error=task`);
    console.error('ea task update failed', err instanceof Error ? err.message : 'error');
    return back(`${list}?error=task`);
  }
  return back(`${list}?notice=saved`);
}
