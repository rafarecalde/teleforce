import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { appRedirect } from '@/lib/http';
import { isUserId, markOnboardingComplete } from '@/lib/match';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const admin = await adminPrincipal();
  if (!admin) return back('/admin');

  const form = await req.formData().catch(() => null);
  const userId = String(form?.get('userId') ?? '');
  const returnTo = form?.get('returnTo') === 'edit' && isUserId(userId) ? `/admin/${userId}` : '/admin';
  if (!isUserId(userId)) return back('/admin?error=missing');

  try {
    const result = await markOnboardingComplete(userId, new Date().toISOString());
    if (result === 'missing') return back(`${returnTo}?error=missing`);
  } catch (err) {
    console.error('mark onboarding failed', err instanceof Error ? err.message : 'error');
    return back(`${returnTo}?error=save`);
  }
  return back(`${returnTo}?notice=onboarding`);
}
