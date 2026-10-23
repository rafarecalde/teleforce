import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { appRedirect, requestEvidence } from '@/lib/http';
import { acceptMatch, getMatchByUserId } from '@/lib/match';
import { sendMatchAcceptedClientEmail, sendMatchAcceptedInternalEmail } from '@/lib/match-email';
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

  const { ip, userAgent } = requestEvidence(req);
  const acceptedAt = new Date().toISOString();
  let status: 'accepted' | 'already' | 'unavailable' = 'unavailable';
  try {
    status = await acceptMatch({
      userId: session.userId,
      acceptedAt,
      ip,
      userAgent,
      method: 'portal',
    });
  } catch (err) {
    console.error('match accept failed', err instanceof Error ? err.message : 'error');
    return back('/?match=unavailable');
  }

  if (status === 'unavailable') return back('/?match=unavailable');

  if (status === 'accepted') {
    try {
      const user = await getUserById(session.userId);
      const match = await getMatchByUserId(session.userId);
      if (user && match) {
        await Promise.all([
          sendMatchAcceptedClientEmail({
            to: user.email,
            fullName: user.fullName,
            eaName: match.eaName,
          }),
          sendMatchAcceptedInternalEmail({
            fullName: user.fullName,
            email: user.email,
            eaName: match.eaName,
            acceptedAt: match.matchAcceptedAt || acceptedAt,
            stripeCustomerId: user.stripeCustomerId,
            method: 'portal',
          }),
        ]);
      }
    } catch (err) {
      console.error('match acceptance email failed', err instanceof Error ? err.message : 'error');
    }
  }

  return back('/#kickoff');
}
