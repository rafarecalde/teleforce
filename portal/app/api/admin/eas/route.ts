import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { createEaAccount, getEaById, refreshEaInvite } from '@/lib/ea';
import { sendEaInviteEmail } from '@/lib/ea-email';
import { appRedirect, HttpError } from '@/lib/http';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const admin = await adminPrincipal();
  if (!admin) return back('/admin');

  const form = await req.formData().catch(() => null);
  const intent = String(form?.get('intent') ?? '');

  try {
    if (intent === 'invite') {
      const eaId = String(form?.get('eaId') ?? '');
      const url = await refreshEaInvite(eaId);
      const ea = url ? await getEaById(eaId) : null;
      if (!url || !ea) return back('/admin/eas?error=missing');
      const mailed = await sendEaInviteEmail({ to: ea.email, fullName: ea.fullName, inviteUrl: url });
      return back(`/admin/eas?notice=invite&ea=${ea.id}&mail=${mailed ? 'sent' : 'failed'}`);
    }

    const created = await createEaAccount({
      email: String(form?.get('email') ?? ''),
      fullName: String(form?.get('fullName') ?? ''),
      linkByName: form?.get('linkByName') === '1',
    });
    const ea = await getEaById(created.id);
    const mailed = ea
      ? await sendEaInviteEmail({ to: ea.email, fullName: ea.fullName, inviteUrl: created.inviteUrl })
      : false;
    const pending = created.pendingUserId ? `&pending=${created.pendingUserId}` : '';
    const asked = form?.get('linkByName') === '1' ? '&link=1' : '';
    return back(`/admin/eas?notice=created&ea=${created.id}&mail=${mailed ? 'sent' : 'failed'}&linked=${created.linked}&matches=${created.matches}${pending}${asked}`);
  } catch (err) {
    if (err instanceof HttpError && err.status === 409) return back('/admin/eas?error=exists');
    if (err instanceof HttpError && err.status === 400) {
      const code = err.message.includes('email') ? 'email' : 'name';
      return back(`/admin/eas?error=${code}`);
    }
    console.error('ea account save failed', err instanceof Error ? err.message : 'error');
    return back('/admin/eas?error=save');
  }
}
