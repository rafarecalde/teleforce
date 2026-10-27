import { HttpError } from './http';

/** Marketing leads. Always this mailbox. Not a caller-supplied address. */
export const SALES_LEAD_TO = 'sales@tryteleforce.com';

const KINDS = ['get-started', 'quiz', 'quiz-match'] as const;
export type LeadKind = (typeof KINDS)[number];

const TRACKING_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'li_fat_id',
] as const;

export type SalesLead = {
  kind: LeadKind;
  email: string;
  name: string;
  company: string;
  handoff: string;
  page: string;
  band: string;
  bandName: string;
  quizAnswers: string;
  matchProfile: string;
  matchCount: string;
  firstName: string;
  lastName: string;
  hdyhau: string;
  phone: string;
  smsConsent: string;
  consent: string;
  tracking: { key: string; value: string }[];
};

type Outbound = {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return {};
}

function clip(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function oneLine(value: string): string {
  return value.replace(/[\r\n\u0000]/g, ' ').replace(/\s+/g, ' ').trim();
}

function looksLikeEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function pageUrl(value: string): string {
  if (!value || value.length > 500) return '';
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.toString().slice(0, 500);
  } catch {
    return '';
  }
}

function isKind(value: string): value is LeadKind {
  return (KINDS as readonly string[]).includes(value);
}

/** A filled honeypot is a bot. Callers should pretend the send worked. */
export function leadIsHoneypot(body: unknown): boolean {
  const record = asRecord(body);
  return Boolean(clip(record.honey, 200) || clip(record._honey, 200));
}

export function parseSalesLead(body: unknown): SalesLead {
  const record = asRecord(body);
  const kindRaw = clip(record.kind, 40);
  if (!isKind(kindRaw)) throw new HttpError(400, 'That form could not be sent.');
  const email = clip(record.email, 254).toLowerCase();
  if (!looksLikeEmail(email)) throw new HttpError(400, 'Enter a work email.');

  const lead: SalesLead = {
    kind: kindRaw,
    email,
    name: oneLine(clip(record.name, 120)),
    company: oneLine(clip(record.company, 160)),
    handoff: clip(record.handoff, 500),
    page: pageUrl(clip(record.page, 500)),
    band: oneLine(clip(record.band, 40)),
    bandName: oneLine(clip(record.band_name, 80)),
    quizAnswers: clip(record.quiz_answers, 4000),
    matchProfile: clip(record.match_profile, 2000),
    matchCount: oneLine(clip(record.match_count, 20)),
    firstName: oneLine(clip(record.first_name, 80)),
    lastName: oneLine(clip(record.last_name, 80)),
    hdyhau: oneLine(clip(record.hdyhau, 80)),
    phone: oneLine(clip(record.phone, 40)),
    smsConsent: oneLine(clip(record.sms_consent, 20)),
    consent: oneLine(clip(record.consent, 20)),
    tracking: [],
  };

  if (lead.kind === 'get-started') {
    if (lead.name.length < 2) throw new HttpError(400, 'Add your name.');
    if (lead.company.length < 2) throw new HttpError(400, 'Add your company.');
    if (lead.handoff.length < 2) throw new HttpError(400, 'Tell us what you’d hand off first.');
  }

  for (const key of TRACKING_KEYS) {
    const value = oneLine(clip(record[key], 200));
    if (value) lead.tracking.push({ key, value });
  }
  return lead;
}

function subjectFor(lead: SalesLead): string {
  if (lead.kind === 'get-started') return `Get started — ${lead.company || lead.email}`;
  const band = lead.bandName || lead.band || 'quiz';
  if (lead.kind === 'quiz-match') return `EA Fit Quiz match request — ${band}`;
  return `EA Fit Quiz lead — ${band}`;
}

function rowsFor(lead: SalesLead): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: 'Form', value: lead.kind },
    { label: 'Email', value: lead.email },
  ];
  const extra: { label: string; value: string }[] = [
    { label: 'Name', value: lead.name },
    { label: 'Company', value: lead.company },
    { label: 'Handoff', value: lead.handoff },
    { label: 'Page', value: lead.page },
    { label: 'Band', value: lead.band },
    { label: 'Band name', value: lead.bandName },
    { label: 'Match count', value: lead.matchCount },
    { label: 'Match profile', value: lead.matchProfile },
    { label: 'Quiz answers', value: lead.quizAnswers },
    { label: 'First name', value: lead.firstName },
    { label: 'Last name', value: lead.lastName },
    { label: 'How they heard', value: lead.hdyhau },
    { label: 'Phone', value: lead.phone },
    { label: 'SMS consent', value: lead.smsConsent },
    { label: 'Email consent', value: lead.consent },
  ];
  for (const row of extra) {
    if (row.value) rows.push(row);
  }
  for (const item of lead.tracking) rows.push({ label: item.key, value: item.value });
  return rows;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSalesLead(lead: SalesLead): Outbound {
  const rows = rowsFor(lead);
  const subject = oneLine(subjectFor(lead)).slice(0, 180);
  const text = `${subject}\n\n${rows.map((row) => `${row.label}: ${row.value}`).join('\n')}\n`;
  const cover = rows
    .map((row) => {
      return `<tr><th align="left" style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</th><td style="padding:6px 0;vertical-align:top;">${escapeHtml(row.value)}</td></tr>`;
    })
    .join('');
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 28px 32px;border:1px solid #e4ddd0;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7c78;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${escapeHtml(subject)}</h1>
    <table style="border-collapse:collapse;margin:0;font-size:14px;">${cover}</table>
  </div>
</body>
</html>`;
  return { to: SALES_LEAD_TO, replyTo: lead.email, subject, text, html };
}

function safeLog(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Email failed';
  return message
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[key]')
    .replace(/\bre_[A-Za-z0-9]{8,}\b/g, '[key]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [key]')
    .slice(0, 400);
}

/** Sends to sales@. Throws HttpError when Resend is missing or rejects the message. */
export async function sendSalesLead(lead: SalesLead): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) throw new HttpError(503, 'Lead email is not configured.');

  const message = renderSalesLead(lead);
  let response: Response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        reply_to: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
  } catch (err) {
    console.error('sales lead email failed', safeLog(err));
    throw new HttpError(502, 'Lead email did not send.');
  }

  const raw = await response.text();
  if (!response.ok) {
    console.error('sales lead email failed', `Resend returned ${response.status}`.slice(0, 80));
    throw new HttpError(502, 'Lead email did not send.');
  }
  try {
    const parsed = JSON.parse(raw) as { id?: unknown };
    const id = typeof parsed.id === 'string' ? parsed.id : '';
    console.info('sales lead email sent', lead.kind, id);
    return id;
  } catch {
    console.info('sales lead email sent', lead.kind);
    return '';
  }
}
