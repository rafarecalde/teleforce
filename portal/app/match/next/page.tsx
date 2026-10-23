export const dynamic = 'force-dynamic';

export default function NextMatchPage() {
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
            <p className="meet-kicker">We&apos;re on it</p>
            <h2>A new introduction is on the way</h2>
            <p className="meet-lead">
              Thanks for telling us. Your Partnership Manager will send another match, and you&apos;ll have a fresh window to say yes.
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
