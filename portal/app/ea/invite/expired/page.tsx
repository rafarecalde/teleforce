export const dynamic = 'force-dynamic';

export default function ExpiredInvitePage() {
  return (
    <>
      <header className="topbar">
        <div className="row">
          <span className="brand"><span className="dot" />TELEFORCE</span>
        </div>
      </header>
      <main>
        <div className="wrap">
          <section className="card">
            <h1 className="page-title display">Link expired</h1>
            <p className="page-sub">This set-password link has expired. Ask your Partnership Manager for a new one.</p>
          </section>
        </div>
      </main>
    </>
  );
}
