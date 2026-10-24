import Script from 'next/script';
import { getSession } from '@/lib/auth';
import { BILLING_NOTE, kickoffCalendlyUrl, TERMS_URL } from '@/lib/match-terms';
import { loadTaskBoard } from '@/lib/tasks';
import type { CalendarLinks } from '@/lib/task-types';
import { getUserById } from '@/lib/users';
import FirstTaskPrompt from '../components/FirstTaskPrompt';

export const dynamic = 'force-dynamic';

export default async function KickoffPage() {
  const url = kickoffCalendlyUrl();
  let signedIn = false;
  let feeds: CalendarLinks | null = null;
  try {
    const session = await getSession();
    if (session) {
      const user = await getUserById(session.userId);
      if (user && user.id === session.userId) {
        signedIn = true;
        feeds = (await loadTaskBoard(user.id)).feeds;
      }
    }
  } catch (err) {
    console.error('kickoff tasks', err instanceof Error ? err.message : 'error');
  }
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
            <FirstTaskPrompt signedIn={signedIn} tasksHref="/#tasks" feeds={feeds} />
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
