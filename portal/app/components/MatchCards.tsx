import Script from 'next/script';
import { formatDate } from '@/lib/money';
import type { MatchPackage } from '@/lib/match';
import {
  BILLING_HOLD_SENTENCE,
  BILLING_START_SENTENCE,
  BINDING_SENTENCE,
  DECLINE_SENTENCE,
  KICKOFF_AIM_SENTENCE,
  MATCH_ACCEPTANCE_SENTENCE,
  REMATCH_AFTER_SENTENCE,
  REMATCH_FEE_SENTENCE,
  REMATCH_REQUEST_SENTENCE,
  SILENCE_SENTENCE,
  differentMatchMailto,
  kickoffCalendlyUrl,
  questionsMailto,
  rematchMailto,
  safeImageUrl,
  videoEmbed,
} from '@/lib/match-terms';

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
          Watch the introduction
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
          Open the introduction video
        </a>
      </p>
    </>
  );
}

export default function MeetYourEa({ match }: { match: MatchPackage }) {
  const accepted = Boolean(match.matchAcceptedAt);
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
      <p className="meet-kicker">Your match</p>
      <h2>Meet your EA</h2>
      <div className="meet-head">
        <Portrait url={match.eaPhotoUrl} name={match.eaName} className="meet-photo" />
        <div>
          <p className="meet-name">{match.eaName || 'Your assistant'}</p>
          <p className="meet-role">Proposed executive assistant</p>
        </div>
      </div>

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
          <h3 className="subhead">Partnership Manager</h3>
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

      {!accepted ? (
        <>
          <hr className="divider" />
          <p className="legal-copy" id="match-billing">
            Accepting in the portal is Match Acceptance. {MATCH_ACCEPTANCE_SENTENCE} {BINDING_SENTENCE}
          </p>
          <p className="legal-copy">{BILLING_START_SENTENCE}</p>
          <p className="legal-copy">{BILLING_HOLD_SENTENCE}</p>
          <form action="/api/account/match/accept" method="post" className="meet-actions">
            <button className="btn btn-primary" type="submit" aria-describedby="match-billing">
              Accept match
            </button>
          </form>
          <p className="legal-copy" style={{ marginTop: 14 }}>
            {DECLINE_SENTENCE} {SILENCE_SENTENCE}
          </p>
          {pmEmail && (
            <p className="meet-links">
              <a className="btn-link" href={differentMatchMailto(pmEmail, match.eaName || 'the proposed Assistant')}>
                Request a different match
              </a>
              <a className="btn-link" href={questionsMailto(pmEmail)}>
                Questions? Contact your Partnership Manager
              </a>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="legal-copy">
            {REMATCH_AFTER_SENTENCE} {REMATCH_REQUEST_SENTENCE} {REMATCH_FEE_SENTENCE}
          </p>
          {pmEmail && (
            <p className="meet-links">
              <a className="btn-link" href={rematchMailto(pmEmail, match.eaName || 'my Assistant')}>
                Request a rematch
              </a>
              <a className="btn-link" href={questionsMailto(pmEmail)}>
                Questions? Contact your Partnership Manager
              </a>
            </p>
          )}
        </>
      )}
    </section>
  );
}

export function KickoffPrompt({ match }: { match: MatchPackage }) {
  const url = kickoffCalendlyUrl();
  const when = formatDate(match.matchAcceptedAt);
  return (
    <section className="card meet-card" id="kickoff">
      <p className="meet-kicker">Next step</p>
      <h2>Book your kickoff with {match.eaName}</h2>
      <p className="note ok" role="status">
        You accepted this match{when && when !== '—' ? ` on ${when}` : ''}.
      </p>
      <p className="legal-copy">{KICKOFF_AIM_SENTENCE}</p>
      <p className="legal-copy">{BILLING_START_SENTENCE}</p>
      <p className="legal-copy">{BILLING_HOLD_SENTENCE}</p>
      <p className="meet-actions">
        <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
          Book the kickoff call
        </a>
      </p>
      <div className="calendly-inline-widget" data-url={url} />
      <p className="muted" style={{ fontSize: 13.5, margin: '12px 0 0' }}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open the scheduler
        </a>
      </p>
      {match.kickoffBooked ? (
        <p className="hint" style={{ marginTop: 14 }}>
          Kickoff booked. This card stays until kickoff is marked done.
        </p>
      ) : (
        <form action="/api/account/match/kickoff-booked" method="post" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost" type="submit">
            I’ve booked the kickoff
          </button>
        </form>
      )}
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" />
    </section>
  );
}
