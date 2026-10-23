import { NextRequest } from 'next/server';
import { appRedirect, requestEvidence } from '@/lib/http';
import { acceptMatch, declineMatch, getMatchByUserId } from '@/lib/match';
import { sendMatchAcceptedClientEmail, sendMatchAcceptedInternalEmail } from '@/lib/match-email';
import { readMatchLink } from '@/lib/match-token';
import { getUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const token = req.nextUrl.searchParams.get('token') || '';
  const link = await readMatchLink(token);
  if (!link) return back('/match/link');

  const match = await getMatchByUserId(link.userId).catch(() => null);
  if (!match || match.matchReadyAt !== link.readyAt) return back('/match/link');

  const { ip, userAgent } = requestEvidence(req);
  const at = new Date().toISOString();

  if (link.action === 'decline') {
    let status: Awaited<ReturnType<typeof declineMatch>> = 'unavailable';
    try {
      status = await declineMatch({ userId: link.userId, at });
    } catch (err) {
      console.error('email decline failed', err instanceof Error ? err.message : 'error');
      return back('/match/link');
    }
    if (status === 'accepted') return back('/kickoff');
    if (status === 'declined') return back('/match/next');
    if (status === 'closed' || status === 'late') return back('/match/link');
    return back('/match/link');
  }

  let status: 'accepted' | 'already' | 'unavailable' = 'unavailable';
  try {
    status = await acceptMatch({
      userId: link.userId,
      acceptedAt: at,
      ip,
      userAgent,
      method: 'email',
    });
  } catch (err) {
    console.error('email accept failed', err instanceof Error ? err.message : 'error');
    return back('/match/link');
  }
  if (status === 'unavailable') return back('/match/link');
  if (status === 'accepted') {
    try {
      const user = await getUserById(link.userId);
      const fresh = await getMatchByUserId(link.userId);
      if (user && fresh) {
        await Promise.all([
          sendMatchAcceptedClientEmail({
            to: user.email,
            fullName: user.fullName,
            eaName: fresh.eaName,
          }),
          sendMatchAcceptedInternalEmail({
            fullName: user.fullName,
            email: user.email,
            eaName: fresh.eaName,
            acceptedAt: fresh.matchAcceptedAt || at,
            stripeCustomerId: user.stripeCustomerId,
            method: 'email',
          }),
        ]);
      }
    } catch (err) {
      console.error('email accept notice failed', err instanceof Error ? err.message : 'error');
    }
  }
  return back('/kickoff');
}
