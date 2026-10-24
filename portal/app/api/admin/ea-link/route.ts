import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { linkEaToClient, unlinkEaFromClient } from '@/lib/ea';
import { appRedirect } from '@/lib/http';
import { isUserId } from '@/lib/match';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const admin = await adminPrincipal();
  if (!admin) return back('/admin');

  const form = await req.formData().catch(() => null);
  const userId = String(form?.get('userId') ?? '');
  const intent = String(form?.get('intent') ?? '');
  const edit = isUserId(userId) ? `/admin/${userId}` : '/admin';
  if (!isUserId(userId)) return back('/admin?error=missing');

  try {
    if (intent === 'unlink') {
      await unlinkEaFromClient(userId);
      return back(`${edit}?notice=ea-unlinked`);
    }
    const eaId = String(form?.get('eaId') ?? '');
    if (!UUID.test(eaId)) return back(`${edit}?error=ea`);
    const linked = await linkEaToClient(eaId, userId);
    if (!linked) return back(`${edit}?error=ea`);
    return back(`${edit}?notice=ea-linked`);
  } catch (err) {
    console.error('ea link failed', err instanceof Error ? err.message : 'error');
    return back(`${edit}?error=ea`);
  }
}
