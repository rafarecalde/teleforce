import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { appRedirect } from '@/lib/http';
import { isUserId, markKickoffBooked } from '@/lib/match';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const admin = await adminPrincipal();
  if (!admin) return back('/admin');

  const form = await req.formData().catch(() => null);
  const userId = String(form?.get('userId') ?? '');
  const returnTo = form?.get('returnTo') === 'edit' ? `/admin/${userId}` : '/admin';
  if (!isUserId(userId)) return back('/admin?error=missing');

  try {
    const booked = await markKickoffBooked(userId);
    if (!booked) return back(`${returnTo}?error=kickoff`);
  } catch (err) {
    console.error('mark kickoff booked failed', err instanceof Error ? err.message : 'error');
    return back(`${returnTo}?error=save`);
  }
  return back(`${returnTo}?notice=kickoff-booked`);
}
