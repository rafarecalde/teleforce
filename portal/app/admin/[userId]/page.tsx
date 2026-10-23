import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/money';
import { defaultPartnershipManager, describeMatch, getMatchByUserId, isUserId, type AdminClient } from '@/lib/match';
import { planLabel } from '@/lib/plans';
import { getUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';

function banner(notice?: string, mail?: string, error?: string): { ok: string; err: string } {
  let ok = '';
  if (notice === 'saved') ok = 'Draft saved. The client doesn’t see it until you publish.';
  if (notice === 'published' && mail === 'sent') ok = 'Match published. The client was emailed, and the assistant name is on the account.';
  if (notice === 'published' && mail !== 'sent') {
    ok = 'Match published and the assistant name is on the account. The client email did not send. Check RESEND_API_KEY and EMAIL_FROM, then publish again to resend.';
  }
  if (notice === 'kickoff') ok = 'Kickoff marked done.';
  if (notice === 'onboarding') ok = 'Onboarding marked complete.';
  let err = '';
  if (error === 'name') err = 'Enter the assistant’s first and last name.';
  if (error === 'photo') err = 'Photo URLs must be an http(s) link, or a path that starts with /.';
  if (error === 'video') err = 'The intro video must be an http(s) link. YouTube, Loom, and Vimeo are embedded.';
  if (error === 'pm') err = 'Publishing needs a Partnership Manager name and email. Fill them in, or set DEFAULT_PARTNERSHIP_MANAGER_NAME and DEFAULT_PARTNERSHIP_MANAGER_EMAIL.';
  if (error === 'fields') err = 'One of the background fields is too long.';
  if (error === 'missing') err = 'That client was not found.';
  if (error === 'kickoff') err = 'Kickoff can be marked done after the client accepts the match.';
  if (error === 'save') err = 'That update didn’t save. Try again.';
  return { ok, err };
}

export default async function AdminClientPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { notice?: string; mail?: string; error?: string };
}) {
  if (!isUserId(params.userId)) notFound();
  const user = await getUserById(params.userId);
  if (!user) notFound();
  const match = await getMatchByUserId(user.id);
  const defaults = defaultPartnershipManager();
  const { ok, err } = banner(searchParams?.notice, searchParams?.mail, searchParams?.error);
  const summary: AdminClient = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    plan: user.plan,
    createdAt: user.createdAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    matchedEaName: user.matchedEaName,
    hasPackage: Boolean(match),
    eaName: match?.eaName || '',
    matchReadyAt: match?.matchReadyAt || '',
    matchAcceptedAt: match?.matchAcceptedAt || '',
    kickoffBooked: Boolean(match?.kickoffBooked),
    kickoffCompletedAt: match?.kickoffCompletedAt || '',
  };

  return (
    <>
      <p className="page-sub" style={{ marginBottom: 8 }}>
        <a href="/admin">All clients</a>
      </p>
      <h1 className="page-title display">{user.fullName || user.email}</h1>
      <p className="page-sub admin-email">
        {user.email} · {planLabel(user.plan)} · Signed up {formatDate(user.createdAt)}
      </p>
      {ok && <p className="note ok" role="status">{ok}</p>}
      {err && <p className="note err" role="alert">{err}</p>}

      <section className="card">
        <h2>Account</h2>
        <div className="kv">
          <span className="k">Onboarding</span>
          <span className="v">{user.onboardingCompletedAt ? `Complete · ${formatDate(user.onboardingCompletedAt)}` : 'Not complete'}</span>
          <span className="k">Match</span>
          <span className="v">{describeMatch(summary)}</span>
          <span className="k">Presented</span>
          <span className="v">{match?.matchReadyAt ? formatDate(match.matchReadyAt) : '—'}</span>
          <span className="k">Accepted</span>
          <span className="v">{match?.matchAcceptedAt ? formatDate(match.matchAcceptedAt) : '—'}</span>
        </div>
        <div className="admin-actions">
          {!user.onboardingCompletedAt && (
            <form action="/api/admin/onboarding" method="post">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnTo" value="edit" />
              <button className="btn btn-ghost" type="submit">
                Mark onboarding complete
              </button>
            </form>
          )}
          {match?.matchAcceptedAt && !match.kickoffCompletedAt && (
            <form action="/api/admin/kickoff" method="post">
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="returnTo" value="edit" />
              <button className="btn btn-ghost" type="submit">
                Mark kickoff done
              </button>
            </form>
          )}
        </div>
      </section>

      <form action="/api/admin/match" method="post" className="card" autoComplete="off">
        <h2>Match package</h2>
        <p className="hint">
          Save keeps a draft. Publish shows Meet your EA, sets the assistant name on the account, and emails the client.
          Publishing again sends the email again and does not change the original presentation date.
          Photos are URLs. This portal doesn’t store uploaded files.
        </p>
        <input type="hidden" name="userId" value={user.id} />

        <div className="field">
          <label htmlFor="eaName">Assistant full name</label>
          <input id="eaName" name="eaName" defaultValue={match?.eaName || ''} maxLength={120} placeholder="First Last" />
        </div>
        <div className="field">
          <label htmlFor="eaPhotoUrl">Photo URL</label>
          <input id="eaPhotoUrl" name="eaPhotoUrl" defaultValue={match?.eaPhotoUrl || ''} maxLength={500} placeholder="https://" inputMode="url" />
        </div>
        <div className="field">
          <label htmlFor="eaVideoUrl">Intro video URL</label>
          <input
            id="eaVideoUrl"
            name="eaVideoUrl"
            defaultValue={match?.eaVideoUrl || ''}
            maxLength={500}
            placeholder="YouTube, Loom, or Vimeo link"
            inputMode="url"
          />
        </div>
        <div className="field">
          <label htmlFor="experience">Experience</label>
          <textarea id="experience" name="experience" defaultValue={match?.experience || ''} maxLength={2000} />
        </div>
        <div className="field">
          <label htmlFor="languages">Languages</label>
          <textarea id="languages" name="languages" defaultValue={match?.languages || ''} maxLength={2000} />
        </div>
        <div className="field">
          <label htmlFor="tools">Tools</label>
          <textarea id="tools" name="tools" defaultValue={match?.tools || ''} maxLength={2000} />
        </div>
        <div className="field">
          <label htmlFor="strengths">Strengths</label>
          <textarea id="strengths" name="strengths" defaultValue={match?.strengths || ''} maxLength={2000} />
        </div>
        <div className="grid2">
          <div className="field">
            <label htmlFor="timezone">Timezone</label>
            <input id="timezone" name="timezone" defaultValue={match?.timezone || ''} maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor="hours">Hours</label>
            <input id="hours" name="hours" defaultValue={match?.hours || ''} maxLength={160} />
          </div>
        </div>

        <h3 className="subhead">Partnership Manager</h3>
        <p className="hint">
          Empty fields use DEFAULT_PARTNERSHIP_MANAGER_NAME and DEFAULT_PARTNERSHIP_MANAGER_EMAIL when those are set.
        </p>
        <div className="field">
          <label htmlFor="pmName">Name</label>
          <input id="pmName" name="pmName" defaultValue={match?.pmName || defaults.name} maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="pmEmail">Email</label>
          <input id="pmEmail" name="pmEmail" type="email" defaultValue={match?.pmEmail || defaults.email} maxLength={254} />
        </div>
        <div className="field">
          <label htmlFor="pmPhotoUrl">Photo URL, optional</label>
          <input id="pmPhotoUrl" name="pmPhotoUrl" defaultValue={match?.pmPhotoUrl || ''} maxLength={500} placeholder="https://" inputMode="url" />
        </div>

        <div className="admin-actions">
          <button className="btn btn-ghost" type="submit" name="intent" value="save">
            {match?.matchReadyAt ? 'Save changes' : 'Save draft'}
          </button>
          <button className="btn btn-primary" type="submit" name="intent" value="publish">
            Publish and email client
          </button>
        </div>
      </form>
    </>
  );
}
