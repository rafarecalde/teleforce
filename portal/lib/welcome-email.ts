import { onboardingCalendlyUrl } from './constants';

/** Public client portal. The onboarding scheduler is on the signed-in home page. */
export const PORTAL_URL = 'https://portal.tryteleforce.com';

export type WelcomeEmailInput = {
  to: string;
  fullName: string;
};

export type WelcomeEmailContent = {
  subject: string;
  text: string;
  html: string;
};

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

function greetingName(fullName: string): string {
  return oneLine(fullName).split(' ')[0] || '';
}

function safeLog(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Email failed';
  return message
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[key]')
    .replace(/\bre_[A-Za-z0-9]{8,}\b/g, '[key]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [key]')
    .slice(0, 400);
}

/**
 * Client welcome note. Billing language follows Terms §3.1 and §3.3:
 * nothing is charged at signup; the first monthly fee and the Initial
 * Period begin on the earlier of Kickoff and the third business day
 * after Match Acceptance.
 */
export function renderWelcomeEmail(input: WelcomeEmailInput): WelcomeEmailContent {
  const name = greetingName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const calendlyUrl = onboardingCalendlyUrl();
  const subject = 'Welcome to Teleforce';
  const billing =
    'Nothing is charged until your Executive Assistant starts. No amount is charged at signup. The first monthly fee is charged, and your initial period begins, on the earlier of your Kickoff date and the third business day after Match Acceptance.';

  const text = `${hello}

Thank you for signing up for Teleforce. We're glad to have you.

The next step is a short onboarding call so we can learn what you need and start matching your Executive Assistant.

Book your onboarding call:
${calendlyUrl}

You can also find this link in your portal at ${PORTAL_URL}.

${billing}

Teleforce
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 28px 32px;border:1px solid #e4ddd0;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7c78;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Welcome to Teleforce</h1>
    <p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
    <p style="margin:0 0 16px;">Thank you for signing up for Teleforce. We're glad to have you.</p>
    <p style="margin:0 0 20px;">The next step is a short onboarding call so we can learn what you need and start matching your Executive Assistant.</p>
    <p style="margin:0 0 8px;">
      <a href="${escapeHtml(calendlyUrl)}" style="display:inline-block;background:#f2a82b;color:#091c1e;font-weight:700;font-family:Georgia,serif;font-size:16px;line-height:1.2;text-decoration:none;padding:12px 18px;border-radius:9px;">Book your onboarding call</a>
    </p>
    <p style="margin:0 0 16px;font-size:14px;">Or copy this link:<br><a href="${escapeHtml(calendlyUrl)}" style="color:#17302e;">${escapeHtml(calendlyUrl)}</a></p>
    <p style="margin:0 0 16px;">You can also find this link in your portal at <a href="${PORTAL_URL}" style="color:#17302e;">${PORTAL_URL}</a>.</p>
    <p style="margin:0;">${escapeHtml(billing)}</p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

async function deliverWelcomeEmail(input: WelcomeEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or EMAIL_FROM is not set.');
  }

  const content = renderWelcomeEmail(input);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
    signal: AbortSignal.timeout(10000),
  });

  const raw = await response.text();
  if (!response.ok) {
    let message = `Resend returned ${response.status}`;
    try {
      const parsed = JSON.parse(raw) as { message?: unknown };
      if (typeof parsed.message === 'string' && parsed.message.trim()) {
        message = `Resend returned ${response.status}: ${parsed.message.trim()}`;
      }
    } catch {
      // Status is enough. Do not log an unstructured body.
    }
    throw new Error(message.slice(0, 400));
  }

  try {
    const parsed = JSON.parse(raw) as { id?: unknown };
    return typeof parsed.id === 'string' ? parsed.id : '';
  } catch {
    return '';
  }
}

/**
 * Client welcome after a new account is saved. Same Resend key and EMAIL_FROM
 * as the Terms email. Never throws: a missing config or a send error is logged
 * and signup still succeeds.
 */
export async function sendWelcomeEmail(input: WelcomeEmailInput): Promise<void> {
  try {
    const resendId = await deliverWelcomeEmail(input);
    console.info('welcome email sent', resendId);
  } catch (err) {
    console.error('welcome email failed', safeLog(err));
  }
}
