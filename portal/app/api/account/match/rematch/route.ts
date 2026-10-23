import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { appRedirect } from '@/lib/http';
import { getMatchByUserId, requestRematch } from '@/lib/match';
import { sendOpsNote } from '@/lib/match-email';
import { getUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  let session = null;
  try {
    session = await getSession();
  } catch {
    return back('/');
  }
  if (!session) return back('/');

  const form = await req.formData().catch(() => null);
  const note = typeof form?.get('note') === 'string' ? String(form.get('note')) : '';

  try {
    const status = await requestRematch({ userId: session.userId, at: new Date().toISOString(), note });
    if (status === 'used') return back('/?match=rematch-used');
    if (status !== 'ok') return back('/?match=unavailable');
    const user = await getUserById(session.userId);
    const match = await getMatchByUserId(session.userId);
    if (user && match) {
      const detail = note.trim();
      await sendOpsNote({
        subject: `Rematch requested: ${user.fullName || user.email}`,
        lines: [
          `${user.fullName} asked for a rematch.`,
          user.email,
          `Assistant: ${match.eaName}`,
          detail ? `Note: ${detail}` : 'No note.',
        ],
      });
    }
    return back('/?match=rematch');
  } catch (err) {
    console.error('rematch request failed', err instanceof Error ? err.message : 'error');
    return back('/?match=unavailable');
  }
}
