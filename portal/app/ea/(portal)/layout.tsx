import { getSession } from '@/lib/auth';
import { clientForEa, getEaById } from '@/lib/ea';

export const dynamic = 'force-dynamic';

function Bar({ clientName }: { clientName?: string }) {
  return (
    <header className="topbar">
      <div className="row">
        <a href="/ea" className="brand" style={{ textDecoration: 'none' }}>
          <span className="dot" />
          TELEFORCE
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {clientName ? (
            <span id="ea-client-name" className="mono" style={{ fontSize: 12, color: 'var(--on-dark-mut)' }}>
              {clientName}
            </span>
          ) : (
            <span className="mono" style={{ fontSize: 12, color: 'var(--on-dark-mut)' }}>Assistant</span>
          )}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="mono"
              style={{ background: 'none', border: 'none', color: 'var(--on-dark-mut)', cursor: 'pointer', fontSize: 12.5 }}
            >
              Sign out
            </button>
          </form>
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
        <header className="topbar">
          <div className="row">
            <span className="brand"><span className="dot" />TELEFORCE</span>
          </div>
        </header>
        <main>
          <div className="wrap">
            <h1 className="page-title display">Assistant sign-in</h1>
            <p className="page-sub">Sign in with the password from your invite. This page is only your client’s tasks.</p>
            <a className="btn btn-primary" href="/">Sign in</a>
          </div>
        </main>
      </>
    );
  }

  const client = await clientForEa(ea.id);
  const clientName = client ? (client.fullName || client.email) : '';

  return (
    <>
      <Bar clientName={clientName} />
      <main>
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}
