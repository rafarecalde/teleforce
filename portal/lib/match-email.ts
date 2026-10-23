import {
  BILLING_HOLD_SENTENCE,
  BILLING_START_SENTENCE,
  BINDING_SENTENCE,
  DECLINE_SENTENCE,
  KICKOFF_AIM_SENTENCE,
  MATCH_ACCEPTANCE_SENTENCE,
  kickoffCalendlyUrl,
  portalHomeUrl,
} from './match-terms';

const DEFAULT_MATCH_ALERT_TO = 'sales@tryteleforce.com';
const GUAYAQUIL = 'America/Guayaquil';

export type MatchReadyEmailInput = {
  to: string;
  fullName: string;
  eaName: string;
  pmName: string;
  pmEmail: string;
};

export type MatchAcceptedClientInput = {
  to: string;
  fullName: string;
  eaName: string;
};

export type MatchAcceptedInternalInput = {
  fullName: string;
  email: string;
  eaName: string;
  acceptedAt: string;
  stripeCustomerId: string;
};

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function oneLine(value: string): string {
  return value.replace(/[\r\n\u0000]/g, ' ').replace(/\s+/g, ' ').trim();
}

function firstName(value: string): string {
  return oneLine(value).split(' ')[0] || '';
}

function safeLog(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Email failed';
  return message
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[key]')
    .replace(/\bre_[A-Za-z0-9]{8,}\b/g, '[key]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [key]')
    .slice(0, 400);
}

function formatGuayaquil(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return oneLine(iso);
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: GUAYAQUIL,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(date);
  return `${formatted} (${GUAYAQUIL})`;
}

function stripeCustomerUrl(customerId: string): string {
  if (!customerId || !/^cus_[A-Za-z0-9]+$/.test(customerId)) return '';
  return `https://dashboard.stripe.com/customers/${customerId}`;
}

/**
 * `SIGNUP_ALERT_TO` when it is set (same list as the signup alert).
 * When it is unset, match-acceptance alerts go to sales@tryteleforce.com.
 * Signup alerts keep their own default.
 */
function matchAlertRecipients(): string[] {
  const configured = process.env.SIGNUP_ALERT_TO;
  const source =
    configured == null || configured.trim() === '' ? DEFAULT_MATCH_ALERT_TO : configured;
  const seen = new Set<string>();
  const recipients: string[] = [];
  for (const part of source.split(',')) {
    const email = part.trim();
    if (!looksLikeEmail(email)) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(email);
  }
  return recipients;
}

function shell(heading: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 28px 32px;border:1px solid #e4ddd0;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7c78;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${escapeHtml(heading)}</h1>
    ${inner}
  </div>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;">${escapeHtml(text)}</p>`;
}

function linkParagraph(label: string, href: string): string {
  const safe = escapeHtml(href);
  return `<p style="margin:0 0 16px;"><a href="${safe}" style="color:#17302e;">${escapeHtml(label)}</a><br><span style="font-size:14px;">${safe}</span></p>`;
}

type Outbound = {
  to: string[];
  subject: string;
  html: string;
  text: string;
};

function readyMessage(input: MatchReadyEmailInput): Outbound {
  const name = firstName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const portal = portalHomeUrl();
  const ea = oneLine(input.eaName);
  const pm = [oneLine(input.pmName), oneLine(input.pmEmail)].filter(Boolean).join(' · ');
  const text = `${hello}

Your Teleforce match is ready. ${ea} is the proposed Assistant.

Review the introduction and accept the match in your portal:
${portal}

${MATCH_ACCEPTANCE_SENTENCE} ${BINDING_SENTENCE}

${BILLING_START_SENTENCE}

${BILLING_HOLD_SENTENCE}

${DECLINE_SENTENCE}

${pm ? `Partnership Manager: ${pm}\n` : ''}
Teleforce
`;
  const html = shell(
    'Your match is ready',
    [
      paragraph(hello),
      paragraph(`Your Teleforce match is ready. ${ea} is the proposed Assistant.`),
      paragraph('Review the introduction and accept the match in your portal.'),
      linkParagraph('Open your portal', portal),
      paragraph(`${MATCH_ACCEPTANCE_SENTENCE} ${BINDING_SENTENCE}`),
      paragraph(BILLING_START_SENTENCE),
      paragraph(BILLING_HOLD_SENTENCE),
      paragraph(DECLINE_SENTENCE),
      pm ? paragraph(`Partnership Manager: ${pm}`) : '',
    ].join(''),
  );
  return {
    to: [input.to],
    subject: 'Your Teleforce match is ready',
    html,
    text,
  };
}

function acceptedClientMessage(input: MatchAcceptedClientInput): Outbound {
  const name = firstName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const ea = oneLine(input.eaName);
  const kickoff = kickoffCalendlyUrl();
  const portal = portalHomeUrl();
  const text = `${hello}

You accepted ${ea} as your Assistant. ${MATCH_ACCEPTANCE_SENTENCE} ${BINDING_SENTENCE}

Book your kickoff:
${kickoff}

You can also book from your portal:
${portal}

${KICKOFF_AIM_SENTENCE}

${BILLING_START_SENTENCE}

${BILLING_HOLD_SENTENCE}

Teleforce
`;
  const html = shell(
    'You accepted your match',
    [
      paragraph(hello),
      paragraph(`You accepted ${ea} as your Assistant. ${MATCH_ACCEPTANCE_SENTENCE} ${BINDING_SENTENCE}`),
      paragraph('Book your kickoff with your Assistant.'),
      linkParagraph('Book the kickoff call', kickoff),
      linkParagraph('Open your portal', portal),
      paragraph(KICKOFF_AIM_SENTENCE),
      paragraph(BILLING_START_SENTENCE),
      paragraph(BILLING_HOLD_SENTENCE),
    ].join(''),
  );
  return {
    to: [input.to],
    subject: 'You accepted your Teleforce match',
    html,
    text,
  };
}

function acceptedInternalMessage(input: MatchAcceptedInternalInput): Outbound {
  const customerUrl = stripeCustomerUrl(input.stripeCustomerId);
  const rows: { label: string; value: string; href?: string }[] = [
    { label: 'Client', value: oneLine(input.fullName) },
    { label: 'Email', value: oneLine(input.email) },
    { label: 'Assistant', value: oneLine(input.eaName) },
    { label: 'Accepted', value: formatGuayaquil(input.acceptedAt) },
    customerUrl
      ? { label: 'Stripe customer', value: customerUrl, href: customerUrl }
      : { label: 'Stripe customer', value: 'None' },
  ];
  const text = `Match accepted\n\n${rows.map((row) => `${row.label}: ${row.value}`).join('\n')}\n`;
  const cover = rows
    .map((row) => {
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value);
      return `<tr><th align="left" style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</th><td style="padding:6px 0;vertical-align:top;">${value}</td></tr>`;
    })
    .join('');
  const html = shell('Match accepted', `<table style="border-collapse:collapse;margin:0;font-size:14px;">${cover}</table>`);
  const who = oneLine(input.fullName).slice(0, 80) || 'Client';
  return {
    to: matchAlertRecipients(),
    subject: `Match accepted: ${who}`,
    html,
    text,
  };
}

async function deliver(message: Outbound): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or EMAIL_FROM is not set.');
  }
  if (message.to.length === 0) {
    throw new Error('No recipient for match email.');
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const raw = await response.text();
  if (!response.ok) {
    let detail = `Resend returned ${response.status}`;
    try {
      const parsed = JSON.parse(raw) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        detail = `Resend returned ${response.status}: ${parsed.message.trim()}`;
      }
    } catch {
      // Status is enough. Do not log an unstructured body.
    }
    throw new Error(detail.slice(0, 400));
  }
  try {
    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id : '';
  } catch {
    return '';
  }
}

async function send(label: string, message: Outbound): Promise<boolean> {
  try {
    const resendId = await deliver(message);
    console.info(`${label} sent`, resendId);
    return true;
  } catch (err) {
    console.error(`${label} failed`, safeLog(err));
    return false;
  }
}

/** Client notice when ops publishes a match. Never throws. */
export function sendMatchReadyEmail(input: MatchReadyEmailInput): Promise<boolean> {
  if (!looksLikeEmail(input.to)) {
    console.error('match ready email skipped invalid recipient');
    return Promise.resolve(false);
  }
  return send('match ready email', readyMessage(input));
}

/** Client confirmation after Match Acceptance, with the kickoff link. Never throws. */
export function sendMatchAcceptedClientEmail(input: MatchAcceptedClientInput): Promise<boolean> {
  if (!looksLikeEmail(input.to)) {
    console.error('match accepted email skipped invalid recipient');
    return Promise.resolve(false);
  }
  return send('match accepted email', acceptedClientMessage(input));
}

/** Internal alert. Never throws. */
export function sendMatchAcceptedInternalEmail(input: MatchAcceptedInternalInput): Promise<boolean> {
  const message = acceptedInternalMessage(input);
  if (message.to.length === 0) {
    console.error('match accepted alert has no valid recipient');
    return Promise.resolve(false);
  }
  return send('match accepted alert', message);
}
