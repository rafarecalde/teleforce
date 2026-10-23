import { NextRequest } from 'next/server';
import { adminPrincipal } from '@/lib/admin-auth';
import { formatDeadline } from '@/lib/business-days';
import { appRedirect } from '@/lib/http';
import { getMatchByUserId, isUserId, saveMatchPackage, type MatchDraft } from '@/lib/match';
import { sendMatchReadyEmail } from '@/lib/match-email';
import { matchActionUrl } from '@/lib/match-token';
import { getUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

export async function POST(req: NextRequest) {
  const back = (path: string) => appRedirect(req.nextUrl.origin, path);
  const admin = await adminPrincipal();
  if (!admin) return back('/admin');

  const form = await req.formData().catch(() => null);
  if (!form) return back('/admin?error=save');
  const userId = field(form, 'userId');
  if (!isUserId(userId)) return back('/admin?error=missing');
  const edit = `/admin/${userId}`;

  const draft: MatchDraft = {
    eaName: field(form, 'eaName'),
    eaPhotoUrl: field(form, 'eaPhotoUrl'),
    eaVideoUrl: field(form, 'eaVideoUrl'),
    experience: field(form, 'experience'),
    languages: field(form, 'languages'),
    tools: field(form, 'tools'),
    strengths: field(form, 'strengths'),
    timezone: field(form, 'timezone'),
    hours: field(form, 'hours'),
    pmName: field(form, 'pmName'),
    pmEmail: field(form, 'pmEmail'),
    pmPhotoUrl: field(form, 'pmPhotoUrl'),
  };
  const publish = field(form, 'intent') === 'publish';

  try {
    const saved = await saveMatchPackage(userId, draft, publish);
    if (!saved.ok) return back(`${edit}?error=${saved.error}`);
    if (!publish) return back(`${edit}?notice=saved`);

    const user = await getUserById(userId);
    const match = await getMatchByUserId(userId);
    let mailed = false;
    if (user && match?.matchReadyAt) {
      const acceptUrl = await matchActionUrl({
        userId,
        readyAt: match.matchReadyAt,
        action: 'accept',
      });
      const declineUrl = match.presentation === 1
        ? await matchActionUrl({ userId, readyAt: match.matchReadyAt, action: 'decline' })
        : '';
      mailed = await sendMatchReadyEmail({
        to: user.email,
        fullName: user.fullName,
        eaName: match.eaName,
        eaPhotoUrl: match.eaPhotoUrl,
        eaVideoUrl: match.eaVideoUrl,
        experience: match.experience,
        languages: match.languages,
        tools: match.tools,
        strengths: match.strengths,
        timezone: match.timezone,
        hours: match.hours,
        pmName: match.pmName,
        pmEmail: match.pmEmail,
        deadlineLabel: formatDeadline(match.matchReadyAt),
        acceptUrl,
        declineUrl,
      });
    }
    return back(`${edit}?notice=published&mail=${mailed ? 'sent' : 'failed'}`);
  } catch (err) {
    console.error('save match failed', err instanceof Error ? err.message : 'error');
    return back(`${edit}?error=save`);
  }
}
