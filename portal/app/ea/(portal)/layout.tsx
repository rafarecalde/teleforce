import { getSession } from '@/lib/auth';
import { getEaById } from '@/lib/ea';

export const dynamic = 'force-dynamic';

function Bar({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="topbar">
      <div className="row">
        <a href="/ea" className="brand" style={{ textDecoration: 'none' }}>
          <span className="dot" />
          TELEFORCE
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {signedIn && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--on-dark-mut)' }}>
              Assistant
            </span>
          )}
          {signedIn && (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="mono"
                style={{ background: 'none', border: 'none', color: 'var(--on-dark-mut)', cursor: 'pointer', fontSize: 12.5 }}
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}

export default async function EaLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    session = null;
  }
  const ea = session?.role === 'ea' ? await getEaById(session.userId) : null;
  if (!ea) {
    return (
      <>
        <Bar signedIn={false} />
        <main>
          <div className="wrap">
            <h1 className="page-title display">Assistant sign-in</h1>
            <p className="page-sub">Sign in with the password from your invite. This page is only your task list.</p>
            <a className="btn btn-primary" href="/">Sign in</a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Bar signedIn />
      <main>
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}
