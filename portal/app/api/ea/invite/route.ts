import { NextRequest } from 'next/server';
import { signSession, sessionCookieOptions } from '@/lib/auth';
import { SESSION_COOKIE } from '@/lib/constants';
import { isInviteToken, setInvitePassword } from '@/lib/ea';
import { appRedirect } from '@/lib/http';
import { passwordOk } from '@/lib/password';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const form = await req.formData().catch(() => null);
  const token = String(form?.get('token') ?? '');
  const password = String(form?.get('password') ?? '');
  const confirm = String(form?.get('confirm') ?? '');
  const page = isInviteToken(token) ? `/ea/invite/${token}` : '/ea/invite/expired';

  if (!passwordOk(password)) return back(`${page}?error=password`);
  if (password !== confirm) return back(`${page}?error=match`);

  try {
    const ea = await setInvitePassword(token, password);
    if (!ea) return back('/ea/invite/expired?error=expired');
    const session = await signSession({
      userId: ea.id,
      email: ea.email,
      name: ea.fullName,
      role: 'ea',
    });
    const res = back('/ea');
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
    return res;
  } catch (err) {
    console.error('ea invite failed', err instanceof Error ? err.message : 'error');
    return back(`${page}?error=save`);
  }
}
