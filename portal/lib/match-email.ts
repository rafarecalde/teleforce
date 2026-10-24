import { formatNewYork } from './business-days';
import {
  BILLING_NOTE,
  TERMS_URL,
  kickoffCalendlyUrl,
  portalHomeUrl,
  publicAssetUrl,
  videoEmbed,
} from './match-terms';

const DEFAULT_MATCH_ALERT_TO = 'sales@tryteleforce.com';
const GUAYAQUIL = 'America/Guayaquil';
const INK = '#0e2629';
const PAPER = '#f6f2e8';
const AMBER = '#f2a82b';

export type MatchProfileEmailInput = {
  to: string;
  fullName: string;
  eaName: string;
  eaPhotoUrl: string;
  eaVideoUrl: string;
  experience: string;
  languages: string;
  tools: string;
  strengths: string;
  timezone: string;
  hours: string;
  pmName: string;
  pmEmail: string;
  deadlineLabel: string;
  acceptUrl: string;
  declineUrl: string;
};

export type MatchReadyEmailInput = MatchProfileEmailInput;

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
  method?: string;
  /** When true, the alert tells sales to charge. Omitted on a click before billing starts. */
  chargeNow?: boolean;
  subscriptionStarted?: boolean;
};

export type ChargeAlertInput = {
  fullName: string;
  email: string;
  eaName: string;
  billingStartAt: string;
  stripeCustomerId: string;
  subscriptionStarted: boolean;
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

function logoUrl(): string {
  return `${portalHomeUrl().replace(/\/$/, '')}/brand/logo-light.png`;
}

function shell(heading: string, inner: string): string {
  const logo = escapeHtml(logoUrl());
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border:1px solid #e6dece;border-radius:16px;overflow:hidden;">
        <tr><td style="background:${INK};padding:18px 24px;">
          <img src="${logo}" width="148" height="26" alt="Teleforce" style="display:block;border:0;height:26px;width:auto;" />
        </td></tr>
        <tr><td style="padding:28px 24px 32px;font-family:Georgia,'Times New Roman',serif;color:#17302e;font-size:16px;line-height:1.5;">
          <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:${INK};">${escapeHtml(heading)}</h1>
          ${inner}
        </td></tr>
      </table>
    </td></tr>
  </table>
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

function buttonParagraph(label: string, href: string, tone: 'primary' | 'secondary' = 'primary'): string {
  const safe = escapeHtml(href);
  const style = tone === 'primary'
    ? `display:block;text-align:center;background:${AMBER};color:#091c1e;font-weight:700;font-family:Georgia,serif;font-size:18px;line-height:1.2;text-decoration:none;padding:14px 18px;border-radius:10px;`
    : `display:block;text-align:center;background:#fffdf8;color:${INK};font-weight:700;font-family:Georgia,serif;font-size:16px;line-height:1.2;text-decoration:none;padding:12px 18px;border-radius:10px;border:1px solid #d9d1c3;`;
  return `<p style="margin:0 0 10px;"><a href="${safe}" style="${style}">${escapeHtml(label)}</a></p><p style="margin:0 0 16px;font-size:13px;"><a href="${safe}" style="color:#5a6e69;">${safe}</a></p>`;
}

function termsNoteHtml(): string {
  return `<p style="margin:0;font-size:13px;color:#5a6e69;">${escapeHtml(BILLING_NOTE)} <a href="${TERMS_URL}" style="color:#5e7d72;font-weight:600;">See Terms</a></p>`;
}

function termsNoteText(): string {
  return `${BILLING_NOTE} See Terms: ${TERMS_URL}`;
}

type Outbound = {
  to: string[];
  subject: string;
  html: string;
  text: string;
};

function profileFacts(input: MatchProfileEmailInput): Array<[string, string]> {
  return [
    ['Experience', input.experience],
    ['Languages', input.languages],
    ['Tools', input.tools],
    ['Strengths', input.strengths],
    ['Timezone', input.timezone],
    ['Hours', input.hours],
  ].filter((entry): entry is [string, string] => Boolean(oneLine(entry[1])));
}

function profileBlock(input: MatchProfileEmailInput): { html: string; text: string } {
  const ea = oneLine(input.eaName) || 'Your EA';
  const photo = publicAssetUrl(input.eaPhotoUrl);
  const video = videoEmbed(input.eaVideoUrl);
  const facts = profileFacts(input);
  const pmName = oneLine(input.pmName);
  const pmEmail = oneLine(input.pmEmail);
  const photoHtml = photo
    ? `<img src="${escapeHtml(photo)}" alt="" width="72" height="72" style="border-radius:50%;object-fit:cover;display:block;background:#efe9da;" />`
    : '';
  const factHtml = facts
    .map(([label, value]) => `<tr><td style="padding:4px 12px 4px 0;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;color:#5a6e69;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;vertical-align:top;">${escapeHtml(oneLine(value))}</td></tr>`)
    .join('');
  const html = [
    `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>`,
    photoHtml ? `<td style="padding-right:14px;vertical-align:middle;">${photoHtml}</td>` : '',
    `<td style="vertical-align:middle;"><div style="font-size:20px;font-weight:700;color:${INK};">${escapeHtml(ea)}</div><div style="color:#5a6e69;">Your executive assistant</div></td>`,
    `</tr></table>`,
    video ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(video.href)}" style="color:#5e7d72;font-weight:700;">Watch ${escapeHtml(ea)}'s intro</a></p>` : '',
    factHtml ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:15px;">${factHtml}</table>` : '',
    pmName || pmEmail
      ? paragraph(`${pmName || 'Your Partnership Manager'} is your Partnership Manager${pmEmail ? ` (${pmEmail})` : ''}.`)
      : '',
  ].join('');
  const text = [
    ea,
    video ? `Intro: ${video.href}` : '',
    ...facts.map(([label, value]) => `${label}: ${oneLine(value)}`),
    pmName || pmEmail ? `Partnership Manager: ${pmName}${pmEmail ? ` <${pmEmail}>` : ''}` : '',
  ].filter(Boolean).join('\n');
  return { html, text };
}

function decisionButtons(input: MatchProfileEmailInput): { html: string; text: string } {
  const accept = input.acceptUrl.trim();
  const decline = input.declineUrl.trim();
  const pmEmail = oneLine(input.pmEmail);
  const mailto = pmEmail
    ? `mailto:${pmEmail}?subject=${encodeURIComponent('A different match?')}`
    : '';
  const html = [
    accept ? buttonParagraph('Accept EA', accept, 'primary') : '',
    decline ? buttonParagraph('Request a different match', decline, 'secondary') : '',
    mailto
      ? `<p style="margin:0 0 16px;font-size:14px;">Or write your Partnership Manager: <a href="${escapeHtml(mailto)}" style="color:#5e7d72;">${escapeHtml(pmEmail)}</a></p>`
      : '',
  ].join('');
  const text = [
    accept ? `Accept EA: ${accept}` : '',
    decline ? `Request a different match: ${decline}` : '',
    mailto ? `Or email ${pmEmail}` : '',
  ].filter(Boolean).join('\n');
  return { html, text };
}

function profileMessage(input: MatchProfileEmailInput, kind: 'ready' | 'reminder'): Outbound {
  const name = firstName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const ea = oneLine(input.eaName) || 'your EA';
  const deadline = oneLine(input.deadlineLabel);
  const profile = profileBlock(input);
  const actions = decisionButtons(input);
  const lead = kind === 'ready'
    ? `Wonderful news. ${ea} is your match. Handpicked for how you work.`
    : `A quick nudge. ${ea} is still yours to claim.`;
  const when = deadline ? `Say yes by ${deadline}.` : '';
  const subject = kind === 'ready' ? 'Meet your EA' : 'One day left to meet your EA';
  const heading = kind === 'ready' ? 'Meet your EA' : 'One day left';
  const text = `${hello}

${lead}
${when}

${profile.text}

${actions.text}

${termsNoteText()}

Teleforce
`;
  const html = shell(heading, [
    paragraph(hello),
    paragraph(lead),
    when ? `<p style="margin:0 0 16px;padding:12px 14px;background:${PAPER};border-radius:10px;"><strong>${escapeHtml(when)}</strong></p>` : '',
    profile.html,
    actions.html,
    termsNoteHtml(),
  ].join(''));
  return { to: [input.to], subject, html, text };
}

function readyMessage(input: MatchReadyEmailInput): Outbound {
  return profileMessage(input, 'ready');
}

function reminderMessage(input: MatchProfileEmailInput): Outbound {
  return profileMessage(input, 'reminder');
}

/** HTML used by the client match email. Safe to call without sending. */
export function matchReadyEmailContent(input: MatchReadyEmailInput): { subject: string; html: string; text: string } {
  const message = readyMessage(input);
  return { subject: message.subject, html: message.html, text: message.text };
}

/** HTML used by the 24-hour reminder. Safe to call without sending. */
export function matchReminderEmailContent(input: MatchProfileEmailInput): { subject: string; html: string; text: string } {
  const message = reminderMessage(input);
  return { subject: message.subject, html: message.html, text: message.text };
}

/** HTML for the acceptance email. Safe to call without sending. */
export function allSetEmailContent(input: MatchAcceptedClientInput): { subject: string; html: string; text: string } {
  const message = allSetMessage(input);
  return { subject: message.subject, html: message.html, text: message.text };
}

/** HTML for the one kickoff reminder. Safe to call without sending. */
export function kickoffReminderEmailContent(input: MatchAcceptedClientInput): { subject: string; html: string; text: string } {
  const message = kickoffReminderMessage(input);
  return { subject: message.subject, html: message.html, text: message.text };
}

function allSetMessage(input: MatchAcceptedClientInput): Outbound {
  const name = firstName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const ea = oneLine(input.eaName) || 'your EA';
  const kickoff = kickoffCalendlyUrl();
  const portal = portalHomeUrl();
  const tasksUrl = `${portal.replace(/\/$/, '')}/#tasks`;
  const text = `${hello}

You're all set. ${ea} is ready to start.

Book your kickoff and you'll be handing off your week in no time. We can't wait for you two to meet.

Book your kickoff:
${kickoff}

Want your EA to arrive with work waiting? Assign a first task in your portal. It's optional.

Assign your first task:
${tasksUrl}

Your portal:
${portal}

${termsNoteText()}

Teleforce
`;
  const html = shell(
    "You're all set, book your kickoff",
    [
      paragraph(hello),
      paragraph(`You're all set. ${ea} is ready to start.`),
      paragraph("Book your kickoff and you'll be handing off your week in no time. We can't wait for you two to meet."),
      buttonParagraph('Book your kickoff', kickoff),
      paragraph("Want your EA to arrive with work waiting? Assign a first task in your portal. It's optional."),
      buttonParagraph('Assign your first task', tasksUrl, 'secondary'),
      linkParagraph('Open your portal', portal),
      termsNoteHtml(),
    ].join(''),
  );
  return { to: [input.to], subject: "You're all set, book your kickoff", html, text };
}

function kickoffReminderMessage(input: MatchAcceptedClientInput): Outbound {
  const name = firstName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const ea = oneLine(input.eaName) || 'your EA';
  const kickoff = kickoffCalendlyUrl();
  const portal = portalHomeUrl();
  const text = `${hello}

${ea} is ready whenever you are. Your kickoff is still open.

Grab a time and you'll be handing off your week in no time.

Book your kickoff:
${kickoff}

Your portal:
${portal}

${termsNoteText()}

Teleforce
`;
  const html = shell(
    'Your kickoff is waiting',
    [
      paragraph(hello),
      paragraph(`${ea} is ready whenever you are. Your kickoff is still open.`),
      paragraph("Grab a time and you'll be handing off your week in no time."),
      buttonParagraph('Book your kickoff', kickoff),
      linkParagraph('Open your portal', portal),
      termsNoteHtml(),
    ].join(''),
  );
  return { to: [input.to], subject: 'Your kickoff is waiting', html, text };
}

function acceptedInternalMessage(input: MatchAcceptedInternalInput): Outbound {
  const customerUrl = stripeCustomerUrl(input.stripeCustomerId);
  const rows: { label: string; value: string; href?: string }[] = [
    { label: 'Client', value: oneLine(input.fullName) },
    { label: 'Email', value: oneLine(input.email) },
    { label: 'Assistant', value: oneLine(input.eaName) },
    { label: 'Accepted', value: formatGuayaquil(input.acceptedAt) },
    { label: 'Method', value: oneLine(input.method || '') || 'portal' },
    customerUrl
      ? { label: 'Stripe customer', value: customerUrl, href: customerUrl }
      : { label: 'Stripe customer', value: 'None' },
  ];
  const charge = chargeCopy(Boolean(input.chargeNow), Boolean(input.subscriptionStarted), customerUrl);
  const text = `Match accepted\n\n${rows.map((row) => `${row.label}: ${row.value}`).join('\n')}${charge.text ? `\n\n${charge.text}` : ''}\n`;
  const cover = rows
    .map((row) => {
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value);
      return `<tr><th align="left" style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</th><td style="padding:6px 0;vertical-align:top;">${value}</td></tr>`;
    })
    .join('');
  const html = shell('Match accepted', `<table style="border-collapse:collapse;margin:0 0 16px;font-size:14px;">${cover}</table>${charge.html}`);
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

/** Branded "You're all set" note after a click or portal acceptance. Never throws. */
export function sendMatchAcceptedClientEmail(input: MatchAcceptedClientInput): Promise<boolean> {
  if (!looksLikeEmail(input.to)) {
    console.error('match accepted email skipped invalid recipient');
    return Promise.resolve(false);
  }
  return send('match accepted email', allSetMessage(input));
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

/** 24 hours before the reply deadline. Never throws. */
export function sendMatchReminderEmail(input: MatchProfileEmailInput): Promise<boolean> {
  if (!looksLikeEmail(input.to)) {
    console.error('match reminder email skipped invalid recipient');
    return Promise.resolve(false);
  }
  return send('match reminder email', reminderMessage(input));
}

/** Same "You're all set" note after an automatic acceptance. Never throws. */
export function sendMatchAutoClientEmail(input: MatchAcceptedClientInput): Promise<boolean> {
  if (!looksLikeEmail(input.to)) {
    console.error('match auto email skipped invalid recipient');
    return Promise.resolve(false);
  }
  return send('match auto email', allSetMessage(input));
}

/** One reminder when kickoff is still unbooked a business day later. Never throws. */
export function sendKickoffReminderEmail(input: MatchAcceptedClientInput): Promise<boolean> {
  if (!looksLikeEmail(input.to)) {
    console.error('kickoff reminder email skipped invalid recipient');
    return Promise.resolve(false);
  }
  return send('kickoff reminder email', kickoffReminderMessage(input));
}

function chargeCopy(chargeNow: boolean, started: boolean, customerUrl: string): { html: string; text: string } {
  if (started) {
    const line = customerUrl
      ? `Subscription started in Stripe. ${customerUrl}`
      : 'Subscription started in Stripe.';
    const html = customerUrl
      ? `<p style="margin:0;font-size:15px;"><strong>Subscription started in Stripe.</strong> <a href="${escapeHtml(customerUrl)}">${escapeHtml(customerUrl)}</a></p>`
      : '<p style="margin:0;font-size:15px;"><strong>Subscription started in Stripe.</strong></p>';
    return { html, text: line };
  }
  if (!chargeNow) return { html: '', text: '' };
  const html = customerUrl
    ? `<p style="margin:0;font-size:15px;"><strong>Charge now in Stripe.</strong> <a href="${escapeHtml(customerUrl)}">${escapeHtml(customerUrl)}</a></p>`
    : '<p style="margin:0;font-size:15px;"><strong>Charge now in Stripe.</strong> No Stripe customer is stored on this account.</p>';
  const text = customerUrl
    ? `Charge now in Stripe. ${customerUrl}`
    : 'Charge now in Stripe. No Stripe customer is stored on this account.';
  return { html, text };
}

function chargeAlertMessage(input: ChargeAlertInput): Outbound {
  const customerUrl = stripeCustomerUrl(input.stripeCustomerId);
  const when = formatNewYork(input.billingStartAt) || oneLine(input.billingStartAt);
  const charge = chargeCopy(!input.subscriptionStarted, input.subscriptionStarted, customerUrl);
  const who = oneLine(input.fullName).slice(0, 80) || 'Client';
  const text = `Billing start for ${who}

Client: ${oneLine(input.fullName)}
Email: ${oneLine(input.email)}
Assistant: ${oneLine(input.eaName)}
Billing start: ${when}

${charge.text}
`;
  const html = shell('Billing start', [
    paragraph(`${oneLine(input.fullName)} · ${oneLine(input.email)}`),
    paragraph(`Assistant: ${oneLine(input.eaName)}`),
    paragraph(`Billing start: ${when}`),
    charge.html,
  ].join(''));
  return {
    to: matchAlertRecipients(),
    subject: input.subscriptionStarted ? `Subscription started: ${who}` : `Charge now in Stripe: ${who}`,
    html,
    text,
  };
}

/** Short internal note. Never throws. Not a billing instruction. */
export function sendOpsNote(input: { subject: string; lines: string[] }): Promise<boolean> {
  const lines = input.lines.map((line) => oneLine(line)).filter(Boolean);
  const text = `${lines.join('\n')}\n`;
  const html = shell(input.subject, lines.map((line) => paragraph(line)).join(''));
  const message: Outbound = { to: matchAlertRecipients(), subject: input.subject.slice(0, 140), html, text };
  if (message.to.length === 0) {
    console.error('ops note has no valid recipient');
    return Promise.resolve(false);
  }
  return send('ops note', message);
}

/** Sales alert when a billing start is reached and the acceptance email did not already cover it. */
export function sendChargeAlert(input: ChargeAlertInput): Promise<boolean> {
  const message = chargeAlertMessage(input);
  if (message.to.length === 0) {
    console.error('charge alert has no valid recipient');
    return Promise.resolve(false);
  }
  return send('charge alert', message);
}
