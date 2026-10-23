import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { isAdminEmail } from '@/lib/match';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin · Teleforce',
};

function Topbar({ email }: { email?: string }) {
  return (
    <header className="topbar">
      <div className="row">
        <a href="/admin" className="brand" style={{ textDecoration: 'none' }}>
          <span className="dot" />
          TELEFORCE
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {email && (
            <span className="mono" style={{ fontSize: 12, color: 'var(--on-dark-mut)' }}>
              Admin
            </span>
          )}
          <a href="/" className="mono" style={{ fontSize: 12.5, color: 'var(--on-dark-mut)', textDecoration: 'none' }}>
            Portal
          </a>
          {email && (
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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  let broken = false;
  try {
    session = await getSession();
  } catch {
    broken = true;
  }

  if (broken) {
    return (
      <>
        <Topbar />
        <main>
          <div className="wrap admin-wrap">
            <h1 className="page-title display">Admin</h1>
            <p className="page-sub">The portal is missing AUTH_SECRET. Set it and reload.</p>
          </div>
        </main>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Topbar />
        <main>
          <div className="wrap admin-wrap">
            <h1 className="page-title display">Admin</h1>
            <p className="page-sub">Sign in with an allowlisted account, then open Admin again.</p>
            <a className="btn btn-primary" href="/">
              Sign in
            </a>
          </div>
        </main>
      </>
    );
  }

  if (!isAdminEmail(session.email)) {
    return (
      <>
        <Topbar />
        <main>
          <div className="wrap admin-wrap">
            <h1 className="page-title display">Admin</h1>
            <p className="page-sub">This account isn’t on the admin allowlist.</p>
            <a className="btn btn-ghost" href="/">
              Back to the portal
            </a>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar email={session.email} />
      <main>
        <div className="wrap admin-wrap">{children}</div>
      </main>
    </>
  );
}
