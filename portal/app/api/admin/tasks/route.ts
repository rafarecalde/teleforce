import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { appRedirect } from '@/lib/http';
import { isUserId } from '@/lib/match';
import { addTaskComment, updateTask } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const admin = await adminPrincipal();
  if (!admin) return back('/admin');

  const form = await req.formData().catch(() => null);
  const userId = String(form?.get('userId') ?? '');
  const taskId = String(form?.get('taskId') ?? '');
  const intent = String(form?.get('intent') ?? '');
  const edit = isUserId(userId) ? `/admin/${userId}` : '/admin';
  if (!isUserId(userId) || !UUID.test(taskId)) return back(`${edit}?error=task`);

  try {
    if (intent === 'status') {
      const saved = await updateTask(userId, taskId, { status: String(form?.get('status') ?? '') });
      if (!saved) return back(`${edit}?error=task`);
    } else if (intent === 'comment') {
      const saved = await addTaskComment(userId, taskId, 'admin', 'Your EA', String(form?.get('body') ?? ''));
      if (!saved) return back(`${edit}?error=task`);
    } else {
      return back(`${edit}?error=task`);
    }
  } catch (err) {
    console.error('admin task update failed', err instanceof Error ? err.message : 'error');
    return back(`${edit}?error=task`);
  }
  return back(`${edit}?notice=task`);
}
