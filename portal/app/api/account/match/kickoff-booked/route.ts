import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { appRedirect } from '@/lib/http';
import { markKickoffBooked } from '@/lib/match';

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
    await markKickoffBooked(session.userId);
  } catch (err) {
    console.error('kickoff booked failed', err instanceof Error ? err.message : 'error');
  }
  return back('/#kickoff');
}
