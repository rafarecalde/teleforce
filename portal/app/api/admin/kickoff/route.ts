import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { appRedirect } from '@/lib/http';
import { isUserId, markKickoffComplete } from '@/lib/match';

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
    const result = await markKickoffComplete(userId, new Date().toISOString());
    if (result === 'missing') return back(`${returnTo}?error=missing`);
    if (result === 'not-accepted') return back(`${returnTo}?error=kickoff`);
  } catch (err) {
    console.error('mark kickoff failed', err instanceof Error ? err.message : 'error');
    return back(`${returnTo}?error=save`);
  }
  return back(`${returnTo}?notice=kickoff`);
}
