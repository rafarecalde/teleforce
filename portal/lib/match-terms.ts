/**
 * Wording quoted from portal/content/terms.md. Keep these sentences in the
 * Terms file. The portal states the rule; it does not add a new one.
 */

/** §3.3 */
export const BILLING_START_SENTENCE =
  'The first monthly fee is charged, and the Initial Period begins, on the earlier of (a) the Kickoff date and (b) the third (3rd) business day after Match Acceptance (the “Billing Start Date”).';

/** §3.3 */
export const BILLING_HOLD_SENTENCE =
  'If Kickoff has not occurred by the Billing Start Date for reasons attributable to Client, including Client not scheduling or not attending Kickoff, Teleforce will hold the Assistant for Client and fees accrue from the Billing Start Date as though the Services had begun.';

/** §3.2 */
export const MATCH_ACCEPTANCE_SENTENCE =
  'Client’s acceptance of a proposed Assistant, in writing or through the Teleforce portal, is “Match Acceptance.”';

/** §3.4 */
export const BINDING_SENTENCE = 'On Match Acceptance the Order becomes binding for the Initial Period.';

/** §3.2 */
export const DECLINE_SENTENCE =
  'Client may decline the first proposed Assistant and request one additional match, one time only, by written notice delivered within three (3) business days after Teleforce presents that first proposed Assistant and before Client accepts a proposed Assistant.';

/** §3.2 */
export const SILENCE_SENTENCE =
  'If Client does not deliver that notice within that window, the right to a second presentation lapses, and silence is not a request for another match and is not acceptance.';

/** §3.2 */
export const KICKOFF_AIM_SENTENCE =
  'Teleforce aims for Kickoff on the same day as Match Acceptance or the next business day, unless Client schedules a later Kickoff.';

/** §3.2 */
export const REMATCH_AFTER_SENTENCE = 'After Match Acceptance, rematch is available only under Section 4.4.';

/** §4.4 */
export const REMATCH_REQUEST_SENTENCE =
  'If Client considers the Assistant unsuitable in good faith, Client may request a rematch by written notice describing its concerns (including through Client’s partnership or success lead).';

/** §4.4 */
export const REMATCH_FEE_SENTENCE =
  'A rematch does not suspend or reduce the monthly fee, does not restart or shorten the Initial Period, and does not by itself give rise to a right to cancel, a credit, or any other remedy.';

const DEFAULT_KICKOFF_CALENDLY_URL = 'https://calendly.com/tryteleforce-sales';
const DEFAULT_PORTAL_URL = 'https://portal.tryteleforce.com';

/** Kickoff scheduler. `KICKOFF_CALENDLY_URL` when it is an http(s) URL. */
export function kickoffCalendlyUrl(): string {
  return httpUrlOrDefault(process.env.KICKOFF_CALENDLY_URL, DEFAULT_KICKOFF_CALENDLY_URL, 'KICKOFF_CALENDLY_URL');
}

/** Link in match emails. `APP_URL` when set, otherwise the production portal. */
export function portalHomeUrl(): string {
  const configured = process.env.APP_URL?.trim() ?? '';
  if (!configured) return DEFAULT_PORTAL_URL;
  return httpUrlOrDefault(configured, DEFAULT_PORTAL_URL, 'APP_URL');
}

function httpUrlOrDefault(raw: string | undefined, fallback: string, label: string): string {
  const configured = raw?.trim() ?? '';
  if (!configured) return fallback;
  const url = safeHttpUrl(configured);
  if (!url) {
    console.error(`${label} is not an http(s) URL; using the default`);
    return fallback;
  }
  return url;
}

export function safeHttpUrl(raw: string): string {
  const value = raw.trim();
  if (!value || value.length > 500) return '';
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return '';
    return url.href;
  } catch {
    return '';
  }
}

/** https image, or a same-origin path such as /sample/ea.svg. */
export function safeImageUrl(raw: string): string {
  const value = raw.trim();
  if (!value || value.length > 500) return '';
  if (value.startsWith('/') && !value.startsWith('//')) {
    if (value.includes('\\') || /[\s"<>]/.test(value)) return '';
    return value;
  }
  return safeHttpUrl(value);
}

export type VideoPresentation =
  | { kind: 'iframe'; src: string; href: string }
  | { kind: 'link'; href: string };

/**
 * YouTube, Loom, and Vimeo become an embed built from the video id.
 * Any other http(s) URL stays a link. Nothing else is iframed.
 */
export function videoEmbed(raw: string): VideoPresentation | null {
  const href = safeHttpUrl(raw);
  if (!href) return null;
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const src = embedSrc(host, url);
  if (src) return { kind: 'iframe', src, href };
  return { kind: 'link', href };
}

function embedSrc(host: string, url: URL): string {
  const youtubeHosts = new Set(['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'youtu.be']);
  if (youtubeHosts.has(host)) {
    const id = youtubeId(host, url);
    if (/^[A-Za-z0-9_-]{6,32}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    return '';
  }
  if (host === 'loom.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    const id = parts[0] === 'share' || parts[0] === 'embed' ? parts[1] || '' : '';
    if (/^[A-Za-z0-9]{16,64}$/.test(id)) return `https://www.loom.com/embed/${id}`;
    return '';
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = vimeoId(host, url);
    if (/^\d{6,12}$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    return '';
  }
  return '';
}

function youtubeId(host: string, url: URL): string {
  if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
  const fromQuery = url.searchParams.get('v') || '';
  if (fromQuery) return fromQuery;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') return parts[1] || '';
  return '';
}

function vimeoId(host: string, url: URL): string {
  const parts = url.pathname.split('/').filter(Boolean);
  if (host === 'player.vimeo.com') return parts[0] === 'video' ? parts[1] || '' : '';
  return parts[parts.length - 1] || '';
}

export function differentMatchMailto(pmEmail: string, eaName: string): string {
  const subject = 'Request for a different match';
  const body = `I decline the proposed Assistant (${eaName}) and request one additional match. This is written notice within three (3) business days after the presentation and before I accept a proposed Assistant.`;
  return mailto(pmEmail, subject, body);
}

export function questionsMailto(pmEmail: string): string {
  return mailto(pmEmail, 'Question about my Teleforce match', '');
}

export function rematchMailto(pmEmail: string, eaName: string): string {
  const body = `I am requesting a rematch under Section 4.4. My concerns about ${eaName}: `;
  return mailto(pmEmail, 'Rematch request', body);
}

function mailto(email: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${email}?${params.toString()}`;
}
