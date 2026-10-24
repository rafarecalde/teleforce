import { isInviteToken, previewInvite } from '@/lib/ea';

export const dynamic = 'force-dynamic';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="topbar">
        <div className="row">
          <span className="brand"><span className="dot" />TELEFORCE</span>
          <a className="mono" href="/" style={{ color: 'var(--on-dark-mut)', fontSize: 12.5 }}>Sign in</a>
        </div>
      </header>
      <main>
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}

function problem(code?: string): string {
  if (code === 'password') return 'Use at least 8 characters.';
  if (code === 'match') return 'Those passwords don’t match.';
  if (code === 'save') return 'That didn’t save. Try the link again.';
  if (code === 'expired') return 'This link has expired. Ask your Partnership Manager for a new one.';
  return '';
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const invite = isInviteToken(params.token) ? await previewInvite(params.token) : null;
  const err = problem(searchParams?.error);
  if (!invite) {
    return (
      <Shell>
        <section className="card">
          <h1 className="page-title display">Link expired</h1>
          <p className="page-sub">This set-password link has expired. Ask your Partnership Manager for a new one.</p>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="card" id="ea-invite">
        <h1 className="page-title display">Set your password</h1>
        <p className="page-sub">{invite.fullName}. You’ll use {invite.email} to sign in.</p>
        {err && <p className="note err" role="alert">{err}</p>}
        <form action="/api/ea/invite" method="post" autoComplete="off">
          <input type="hidden" name="token" value={params.token} />
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} />
          </div>
          <button className="btn btn-primary" type="submit">Save and open your clients</button>
        </form>
      </section>
    </Shell>
  );
}
