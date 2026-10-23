import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { appRedirect } from '@/lib/http';
import { declineMatch } from '@/lib/match';

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

  try {
    const status = await declineMatch({ userId: session.userId, at: new Date().toISOString() });
    if (status === 'declined') return back('/?match=different');
    if (status === 'accepted') return back('/#kickoff');
    if (status === 'closed') return back('/?match=closed');
    if (status === 'late') return back('/?match=closed');
    return back('/?match=unavailable');
  } catch (err) {
    console.error('match decline failed', err instanceof Error ? err.message : 'error');
    return back('/?match=unavailable');
  }
}
