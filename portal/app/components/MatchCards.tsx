import Script from 'next/script';
import { formatDeadline } from '@/lib/business-days';
import { formatDate } from '@/lib/money';
import type { MatchPackage } from '@/lib/match';
import {
  BILLING_NOTE,
  TERMS_URL,
  kickoffCalendlyUrl,
  questionsMailto,
  safeImageUrl,
  videoEmbed,
} from '@/lib/match-terms';
import type { CalendarLinks } from '@/lib/task-types';
import FirstTaskPrompt from './FirstTaskPrompt';

function TermsNote({ id }: { id?: string }) {
  return (
    <p className="terms-note" id={id}>
      {BILLING_NOTE}{' '}
      <a href={TERMS_URL}>See Terms</a>
    </p>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0] || '').join('');
  return letters.toUpperCase() || 'EA';
}

function Portrait({ url, name, className }: { url: string; name: string; className: string }) {
  const src = safeImageUrl(url);
  if (!src) {
    return (
      <span className={`${className} ph`} aria-hidden="true">
        {initials(name)}
      </span>
    );
  }
  return <img className={className} src={src} alt="" />;
}

function IntroVideo({ url, name }: { url: string; name: string }) {
  const presentation = videoEmbed(url);
  if (!presentation) return null;
  if (presentation.kind === 'link') {
    return (
      <p style={{ margin: '0 0 16px' }}>
        <a href={presentation.href} target="_blank" rel="noopener noreferrer">
          Watch {name}&apos;s intro
        </a>
      </p>
    );
  }
  return (
    <>
      <div className="video-frame">
        <iframe
          src={presentation.src}
          title={`Introduction from ${name}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <p className="muted" style={{ fontSize: 13.5, margin: '0 0 16px' }}>
        <a href={presentation.href} target="_blank" rel="noopener noreferrer">
          Watch {name}&apos;s intro
        </a>
      </p>
    </>
  );
}

export default function MeetYourEa({ match, rematchAvailable = false }: { match: MatchPackage; rematchAvailable?: boolean }) {
  const accepted = Boolean(match.matchAcceptedAt);
  const declined = Boolean(match.declinedAt);
  const deadline = !accepted && !declined ? formatDeadline(match.matchReadyAt) : '';
  const canDecline = !accepted && !declined && match.presentation === 1;
  const facts = [
    ['Experience', match.experience],
    ['Languages', match.languages],
    ['Tools', match.tools],
    ['Strengths', match.strengths],
    ['Timezone', match.timezone],
    ['Hours', match.hours],
  ].filter((entry) => entry[1].trim());
  const pmEmail = match.pmEmail.trim();
  const pmName = match.pmName.trim();

  return (
    <section className="card meet-card" id="meet-your-ea">
      <p className="meet-kicker">It&apos;s a match</p>
      <h2>Meet your EA</h2>
      <div className="meet-head">
        <Portrait url={match.eaPhotoUrl} name={match.eaName} className="meet-photo" />
        <div>
          <p className="meet-name">{match.eaName || 'Your assistant'}</p>
          <p className="meet-role">Your executive assistant</p>
        </div>
      </div>
      <p className="meet-lead">
        Handpicked for how you work. Watch the intro, then say yes and book your kickoff.
      </p>

      <IntroVideo url={match.eaVideoUrl} name={match.eaName || 'your assistant'} />

      {facts.length > 0 && (
        <dl className="bio-list">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(pmName || pmEmail) && (
        <>
          <h3 className="subhead">Your Partnership Manager</h3>
          <div className="pm-row">
            <Portrait url={match.pmPhotoUrl} name={pmName || 'Partnership Manager'} className="pm-photo" />
            <div>
              {pmName && <div style={{ fontWeight: 700 }}>{pmName}</div>}
              {pmEmail && (
                <a href={`mailto:${pmEmail}`}>{pmEmail}</a>
              )}
            </div>
          </div>
        </>
      )}

      {declined && (
        <p className="meet-lead">You asked for a different match. We&apos;re lining up another introduction.</p>
      )}

      {!accepted && !declined && (
        <>
          <hr className="divider" />
          {deadline && (
            <p className="deadline-note">Say yes by <strong>{deadline}</strong>.</p>
          )}
          <form action="/api/account/match/accept" method="post" className="meet-actions">
            <button className="btn btn-primary" type="submit" aria-describedby="match-billing">
              Accept &amp; book your kickoff
            </button>
          </form>
          <TermsNote id="match-billing" />
          {canDecline && (
            <form action="/api/account/match/decline" method="post" style={{ marginTop: 12 }}>
              <button className="btn btn-ghost" type="submit">Request a different match</button>
            </form>
          )}
          {pmEmail && (
            <p className="meet-links">
              <a className="btn-link" href={questionsMailto(pmEmail)}>
                Questions? Your Partnership Manager would love to help
              </a>
            </p>
          )}
        </>
      )}

      {accepted && (
        <>
          <p className="meet-lead">
            Whenever you want to talk it through, your Partnership Manager is right here.
          </p>
          {rematchAvailable && (
            <form action="/api/account/match/rematch" method="post" style={{ marginTop: 8 }}>
              <div className="field">
                <label htmlFor="rematch-note">What would make this a better fit?</label>
                <textarea id="rematch-note" name="note" maxLength={1000} placeholder="Optional. A sentence or two is plenty." />
              </div>
              <button className="btn btn-ghost" type="submit">Request a rematch</button>
            </form>
          )}
          {pmEmail && (
            <p className="meet-links">
              <a className="btn-link" href={questionsMailto(pmEmail)}>
                Questions? Write your Partnership Manager
              </a>
            </p>
          )}
        </>
      )}
    </section>
  );
}

export function KickoffPrompt({ match, feeds }: { match: MatchPackage; feeds: CalendarLinks | null }) {
  const url = kickoffCalendlyUrl();
  const when = formatDate(match.matchAcceptedAt);
  return (
    <section className="card meet-card" id="kickoff">
      <p className="meet-kicker">Your EA is ready to start</p>
      <h2>Book your kickoff with {match.eaName}</h2>
      <p className="note ok" role="status">
        You&apos;re matched{when && when !== '—' ? ` as of ${when}` : ''}. {match.eaName} can&apos;t wait to get started.
      </p>
      <p className="meet-lead">
        Grab a time for a short kickoff. You&apos;ll hand off priorities and be working together in no time.
      </p>
      <p className="meet-actions">
        <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
          Book your kickoff
        </a>
      </p>
      <TermsNote id="kickoff-billing" />
      <FirstTaskPrompt signedIn tasksHref="/#tasks" feeds={feeds} />
      <div className="calendly-inline-widget" data-url={url} />
      <p className="muted" style={{ fontSize: 13.5, margin: '12px 0 0' }}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open the scheduler
        </a>
      </p>
      {match.kickoffBooked ? (
        <p className="hint" style={{ marginTop: 14 }}>
          You&apos;re on the calendar. We&apos;ll leave this here until kickoff is confirmed.
        </p>
      ) : (
        <form action="/api/account/match/kickoff-booked" method="post" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" type="submit">
            I&apos;ve booked my kickoff
          </button>
        </form>
      )}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />
    </section>
  );
}
