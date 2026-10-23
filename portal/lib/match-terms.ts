/** Public Terms page. Billing detail lives there, not in the portal copy. */
export const TERMS_URL = 'https://tryteleforce.com/terms/';

/** Short client-facing billing line. The Terms link carries the detail. */
export const BILLING_NOTE = 'Your plan billing is covered in the Terms.';

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
  const body = `Hi, I'd love to talk about a different match. The assistant I was introduced to is ${eaName}.`;
  return mailto(pmEmail, 'A different match?', body);
}

export function questionsMailto(pmEmail: string): string {
  return mailto(pmEmail, 'A question about my EA', '');
}

export function rematchMailto(pmEmail: string, eaName: string): string {
  const body = `Hi, I'd like to talk about how things are going with ${eaName}.`;
  return mailto(pmEmail, 'A question about my EA', body);
}

function mailto(email: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  params.set('subject', subject);
  if (body) params.set('body', body);
  return `mailto:${email}?${params.toString()}`;
}
