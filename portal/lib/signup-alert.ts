import { planLabel, type PlanCode } from './plans';

const DEFAULT_SIGNUP_ALERT_TO = 'rafael@recaldelaw.com';
const GUAYAQUIL = 'America/Guayaquil';

export type SignupAlertInput = {
  fullName: string;
  email: string;
  plan: PlanCode;
  cardBrand: string;
  cardLast4: string;
  signedUpAt: string;
  stripeCustomerId: string | null;
};

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** `SIGNUP_ALERT_TO` when set, otherwise the default. Comma-separated. */
function signupAlertRecipients(): { recipients: string[]; skipped: number } {
  const configured = process.env.SIGNUP_ALERT_TO;
  const source =
    configured == null || configured.trim() === '' ? DEFAULT_SIGNUP_ALERT_TO : configured;
  const seen = new Set<string>();
  const recipients: string[] = [];
  let skipped = 0;
  for (const part of source.split(',')) {
    const email = part.trim();
    if (!email) continue;
    if (!looksLikeEmail(email)) {
      skipped += 1;
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push(email);
  }
  return { recipients, skipped };
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

function cardOnFile(brand: string, last4: string): string {
  const safeBrand = oneLine(brand);
  const safeLast4 = last4.replace(/\D/g, '').slice(-4);
  if (safeBrand && safeLast4) return `${safeBrand} ···· ${safeLast4}`;
  if (safeLast4) return `···· ${safeLast4}`;
  if (safeBrand) return safeBrand;
  return 'No card on file';
}

function stripeCustomerUrl(customerId: string | null): string {
  if (!customerId || !/^cus_[A-Za-z0-9]+$/.test(customerId)) return '';
  return `https://dashboard.stripe.com/customers/${customerId}`;
}

function formatSignupTime(iso: string): string {
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

function safeLog(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Email failed';
  return message
    .replace(/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]+/g, '[key]')
    .replace(/\bre_[A-Za-z0-9]{8,}\b/g, '[key]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [key]')
    .slice(0, 400);
}

type Row = { label: string; value: string; href?: string };

function rowsFor(input: SignupAlertInput): Row[] {
  const customerUrl = stripeCustomerUrl(input.stripeCustomerId);
  return [
    { label: 'Full name', value: oneLine(input.fullName) },
    { label: 'Email', value: oneLine(input.email) },
    { label: 'Plan', value: planLabel(input.plan) },
    { label: 'Card on file', value: cardOnFile(input.cardBrand, input.cardLast4) },
    { label: 'Signup time', value: formatSignupTime(input.signedUpAt) },
    customerUrl
      ? { label: 'Stripe customer', value: customerUrl, href: customerUrl }
      : { label: 'Stripe customer', value: 'None' },
  ];
}

function renderText(rows: Row[]): string {
  const lines = rows.map((row) => `${row.label}: ${row.value}`);
  return `New Teleforce signup\n\n${lines.join('\n')}\n`;
}

function renderHtml(rows: Row[]): string {
  const cover = rows
    .map((row) => {
      const value = row.href
        ? `<a href="${escapeHtml(row.href)}">${escapeHtml(row.value)}</a>`
        : escapeHtml(row.value);
      return `<tr><th align="left" style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(row.label)}</th><td style="padding:6px 0;vertical-align:top;">${value}</td></tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 28px 32px;border:1px solid #e4ddd0;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7c78;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">New signup</h1>
    <table style="border-collapse:collapse;margin:0;font-size:14px;">${cover}</table>
  </div>
</body>
</html>`;
}

async function deliverSignupAlert(input: SignupAlertInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or EMAIL_FROM is not set.');
  }

  const { recipients, skipped } = signupAlertRecipients();
  if (skipped > 0) {
    console.error('signup alert skipped invalid recipient entries', skipped);
  }
  if (recipients.length === 0) {
    throw new Error('SIGNUP_ALERT_TO has no valid email addresses.');
  }

  const rows = rowsFor(input);
  const plan = planLabel(input.plan);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `New Teleforce signup: ${oneLine(input.fullName)} (${plan})`,
      html: renderHtml(rows),
      text: renderText(rows),
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
 * Internal notice for a new account. Same Resend key and EMAIL_FROM as the
 * Terms email. Never throws: a missing config or a send error is logged.
 */
export async function sendSignupAlertEmail(input: SignupAlertInput): Promise<void> {
  try {
    const resendId = await deliverSignupAlert(input);
    console.info('signup alert email sent', resendId);
  } catch (err) {
    console.error('signup alert email failed', safeLog(err));
  }
}
