import { portalHomeUrl } from './match-terms';

export type EaInviteEmailInput = {
  to: string;
  fullName: string;
  inviteUrl: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || '';
}

function safeLog(err: unknown): string {
  const message = err instanceof Error ? err.message : 'Email failed';
  return message.replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [key]').slice(0, 400);
}

export function renderEaInviteEmail(input: EaInviteEmailInput): { subject: string; text: string; html: string } {
  const name = firstName(input.fullName);
  const hello = name ? `Hi ${name},` : 'Hello,';
  const portal = portalHomeUrl();
  const subject = 'Set your Teleforce password';
  const text = `${hello}

Your task list is ready. Set a password and you'll see the clients matched to you.

Set your password:
${input.inviteUrl}

This link expires in 14 days. After that, sign in at ${portal}.

Teleforce
`;
  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f6f2e8;color:#17302e;font-family:Georgia,serif;font-size:16px;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;background:#fffdf8;padding:28px;border:1px solid #e4ddd0;border-radius:16px;">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5a6e69;">Teleforce</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">Set your password</h1>
    <p style="margin:0 0 16px;">${escapeHtml(hello)}</p>
    <p style="margin:0 0 16px;">Your task list is ready. Set a password and you'll see the clients matched to you.</p>
    <p style="margin:0 0 8px;"><a href="${escapeHtml(input.inviteUrl)}" style="display:block;text-align:center;background:#f2a82b;color:#091c1e;font-weight:700;text-decoration:none;padding:14px 18px;border-radius:10px;">Set your password</a></p>
    <p style="margin:0 0 16px;font-size:13px;"><a href="${escapeHtml(input.inviteUrl)}" style="color:#5a6e69;">${escapeHtml(input.inviteUrl)}</a></p>
    <p style="margin:0;font-size:14px;color:#5a6e69;">This link expires in 14 days. After that, sign in at <a href="${escapeHtml(portal)}" style="color:#17302e;">${escapeHtml(portal)}</a>.</p>
  </div>
</body>
</html>`;
  return { subject, text, html };
}

/** Never throws. A missing Resend config still leaves the link in admin. */
export async function sendEaInviteEmail(input: EaInviteEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim() || '';
  const from = process.env.EMAIL_FROM?.trim() || '';
  if (!apiKey || !from) {
    console.error('ea invite email skipped', 'RESEND_API_KEY or EMAIL_FROM is not set.');
    return false;
  }
  const content = renderEaInviteEmail(input);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: content.subject,
        html: content.html,
        text: content.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error('ea invite email failed', `Resend returned ${response.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('ea invite email failed', safeLog(err));
    return false;
  }
}
