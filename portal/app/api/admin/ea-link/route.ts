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
  const eaId = String(form?.get('eaId') ?? '');
  const intent = String(form?.get('intent') ?? '');
  const onEas = String(form?.get('returnTo') ?? '') === 'eas';
  const edit = isUserId(userId) ? `/admin/${userId}` : '/admin';
  const home = onEas ? '/admin/eas' : edit;
  if (!onEas && !isUserId(userId)) return back('/admin?error=missing');

  try {
    if (intent === 'unlink') {
      if (!isUserId(userId)) return back('/admin/eas?error=missing');
      await unlinkEaFromClient(userId);
      return back(onEas ? '/admin/eas?notice=unlinked' : `${edit}?notice=ea-unlinked`);
    }
    if (!UUID.test(eaId) || !isUserId(userId)) return back(`${home}?error=ea`);
    const linked = await linkEaToClient(eaId, userId, { confirm: form?.get('confirm') === '1' });
    if (linked === 'confirm') {
      const query = onEas
        ? `/admin/eas?confirm=1&ea=${eaId}&user=${userId}`
        : `${edit}?confirm=1&ea=${eaId}`;
      return back(query);
    }
    if (linked !== 'linked') return back(`${home}?error=ea`);
    return back(onEas ? `/admin/eas?notice=linked&ea=${eaId}` : `${edit}?notice=ea-linked`);
  } catch (err) {
    console.error('ea link failed', err instanceof Error ? err.message : 'error');
    return back(`${home}?error=ea`);
  }
}
