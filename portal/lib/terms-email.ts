import { buildTermsPdf } from './terms-pdf';

const DEFAULT_BCC = 'legal@tryteleforce.com';
const TERMS_URL = 'https://tryteleforce.com/terms/';

export type TermsEmailInput = {
  to: string;
  fullName: string;
  planSummary: string;
  signedName: string;
  termsVersion: string;
  termsContentHash: string;
  acceptedAt: string;
  ip: string;
  markdown: string;
};

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Ops copy. `TERMS_ACCEPTANCE_BCC` wins, then `OPS_EMAIL`, then the default. */
export function termsBccAddress(): string {
  return (process.env.TERMS_ACCEPTANCE_BCC || process.env.OPS_EMAIL || DEFAULT_BCC).trim();
}

function opsBcc(clientEmail: string): string | null {
  const candidate = termsBccAddress();
  if (!looksLikeEmail(candidate)) {
    console.error('terms acceptance bcc is not an email; sending without bcc');
    return null;
  }
  if (candidate.toLowerCase() === clientEmail.toLowerCase()) return null;
  return candidate;
}

function safeLog(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Email failed';
  return message
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[key]')
    .replace(/\bre_[A-Za-z0-9]{8,}\b/g, '[key]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [key]')
    .slice(0, 400);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderText(attached: boolean): string {
  const body = attached
    ? 'Your signed copy is attached as a PDF, including your acceptance record.'
    : `We could not attach the PDF to this message. You can read the Terms at ${TERMS_URL}`;
  return `Terms you accepted

This confirms the Teleforce Terms & Conditions you accepted for your executive assistant account. ${body}

Teleforce
`;
}

function renderHtml(attached: boolean): string {
  const body = attached
    ? 'Your signed copy is attached as a PDF, including your acceptance record.'
    : `We could not attach the PDF to this message. You can read the Terms at <a href="${TERMS_URL}" style="color:#17302e;">${escapeHtml(TERMS_URL)}</a>`;
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 28px 32px;border:1px solid #e4ddd0;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7c78;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Terms you accepted</h1>
    <p style="margin:0;">This confirms the Teleforce Terms &amp; Conditions you accepted for your executive assistant account. ${body}</p>
  </div>
</body>
</html>`;
}

type Outbound = {
  apiKey: string;
  from: string;
  to: string;
  bcc: string | null;
  subject: string;
  attached: boolean;
  attachment?: { filename: string; content: string };
};

async function postTermsEmail(message: Outbound): Promise<string> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${message.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: message.from,
      to: [message.to],
      ...(message.bcc ? { bcc: [message.bcc] } : {}),
      subject: message.subject,
      html: renderHtml(message.attached),
      text: renderText(message.attached),
      ...(message.attachment
        ? { attachments: [{ filename: message.attachment.filename, content: message.attachment.content }] }
        : {}),
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
      // Status is enough. Do not store an unstructured body.
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

/**
 * Sends the acceptance note via Resend. The Terms are a PDF attachment.
 * If the PDF cannot be built, or Resend rejects the message that carries it,
 * this logs the error and sends the note with a link to the published Terms
 * instead. Throws only when that fallback send also fails, or mail is not
 * configured. Signup catches that and still creates the account.
 */
export async function sendTermsAcceptanceEmail(input: TermsEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or EMAIL_FROM is not set.');
  }

  const subject = `Teleforce Terms you accepted (${input.termsVersion})`;
  const bcc = opsBcc(input.to);
  let attachment: { filename: string; content: string } | undefined;
  try {
    const pdf = await buildTermsPdf({
      markdown: input.markdown,
      signedName: input.signedName,
      email: input.to,
      planSummary: input.planSummary,
      acceptedAt: input.acceptedAt,
      termsVersion: input.termsVersion,
      termsContentHash: input.termsContentHash,
    });
    attachment = { filename: pdf.filename, content: pdf.bytes.toString('base64') };
  } catch (err) {
    console.error('terms pdf failed', safeLog(err));
  }

  const base = { apiKey, from, to: input.to, bcc, subject };
  if (attachment) {
    try {
      return await postTermsEmail({ ...base, attached: true, attachment });
    } catch (err) {
      console.error('terms email with pdf failed', safeLog(err));
    }
  }

  return postTermsEmail({ ...base, attached: false });
}
