export const dynamic = 'force-dynamic';

export default function MatchLinkPage() {
  return (
    <>
      <header className="topbar">
        <div className="row">
          <span className="brand"><span className="dot" />TELEFORCE</span>
          <a className="mono" href="/" style={{ color: 'var(--on-dark-mut)', fontSize: 12.5 }}>Portal</a>
        </div>
      </header>
      <main>
        <div className="wrap">
          <section className="card meet-card">
            <p className="meet-kicker">Let&apos;s try that again</p>
            <h2>That link has moved on</h2>
            <p className="meet-lead">
              Open your portal for the current introduction. Your Partnership Manager is there if you want a hand.
            </p>
            <p className="meet-actions">
              <a className="btn btn-primary" href="/">Open your portal</a>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
