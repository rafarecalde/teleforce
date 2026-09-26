const DEFAULT_BCC = 'legal@tryteleforce.com';

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function attachmentName(version: string): string {
  const slug = version.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `Teleforce-Terms-${slug || 'accepted'}.md`;
}

function renderHtml(input: TermsEmailInput): string {
  const rows: [string, string][] = [
    ['Name', input.fullName],
    ['Email', input.to],
    ['Plan', input.planSummary],
    ['Signed name', input.signedName],
    ['Terms version', input.termsVersion],
    ['SHA-256', input.termsContentHash],
    ['Accepted at (UTC)', input.acceptedAt],
    ['IP address', input.ip || 'Not available'],
  ];
  const cover = rows
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</th><td style="padding:6px 0;vertical-align:top;">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f1ea;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:28px 28px 32px;border:1px solid #e4ddd0;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7c78;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Terms you accepted</h1>
    <p style="margin:0 0 16px;">This message records the Teleforce Terms &amp; Conditions accepted when this executive assistant account was created. The attached file is the exact Terms text. Its SHA-256 is the hash below.</p>
    <table style="border-collapse:collapse;margin:0 0 20px;font-size:14px;">${cover}</table>
    <h2 style="margin:0 0 8px;font-size:16px;">Terms &amp; Conditions</h2>
    <pre style="margin:0;white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;line-height:1.45;">${escapeHtml(input.markdown)}</pre>
  </div>
</body>
</html>`;
}

/** Sends via Resend. Throws if mail is not configured or Resend rejects the message. */
export async function sendTermsAcceptanceEmail(input: TermsEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY or EMAIL_FROM is not set.');
  }

  const bcc = opsBcc(input.to);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      ...(bcc ? { bcc: [bcc] } : {}),
      subject: `Teleforce Terms you accepted (${input.termsVersion})`,
      html: renderHtml(input),
      attachments: [
        {
          filename: attachmentName(input.termsVersion),
          content: Buffer.from(input.markdown, 'utf8').toString('base64'),
        },
      ],
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
      // Status is enough. Do not store an unstructured body.
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
