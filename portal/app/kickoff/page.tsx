import Script from 'next/script';
import { BILLING_NOTE, kickoffCalendlyUrl, TERMS_URL } from '@/lib/match-terms';

export const dynamic = 'force-dynamic';

export default function KickoffPage() {
  const url = kickoffCalendlyUrl();
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
          <section className="card meet-card" id="kickoff">
            <p className="meet-kicker">You&apos;re all set</p>
            <h2>Book your kickoff</h2>
            <p className="meet-lead">
              Your EA is ready to start. Grab a time and you&apos;ll be handing off your week in no time.
            </p>
            <p className="meet-actions">
              <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
                Book your kickoff
              </a>
            </p>
            <p className="terms-note">
              {BILLING_NOTE} <a href={TERMS_URL}>See Terms</a>
            </p>
            <div className="calendly-inline-widget" data-url={url} />
            <p className="muted" style={{ fontSize: 13.5, margin: '12px 0 0' }}>
              <a href={url} target="_blank" rel="noopener noreferrer">Open the scheduler</a>
            </p>
            <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />
          </section>
        </div>
      </main>
    </>
  );
}
