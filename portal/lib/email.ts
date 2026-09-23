import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const FROM = process.env.MAIL_FROM || 'Teleforce <portal@tryteleforce.com>';
const OPS = () => process.env.OPS_EMAIL || 'ops@tryteleforce.com';

const NAVY = '#102133';
const ORANGE = '#F35E38';

function wrap(title: string, bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:${NAVY};line-height:1.5">
  <p style="font-weight:800;font-size:18px;letter-spacing:-0.02em;color:${NAVY};margin:0 0 20px">TELEFORCE</p>
  <h1 style="font-size:20px;margin:0 0 14px;color:${NAVY}">${title}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e6e8ec;margin:28px 0 14px" />
  <p style="font-size:12px;color:#7a8290;margin:0">Teleforce · tryteleforce.com</p>
</div>`;
}

async function send(to: string | string[], subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    // In local/dev without a key, log instead of failing the request.
    console.log(`[email suppressed: no RESEND_API_KEY] to=${to} subject=${subject}`);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendMagicLink(email: string, link: string) {
  const html = wrap(
    'Sign in to your account',
    `<p>Click below to sign in to your Teleforce client account. This link expires in 15 minutes.</p>
     <p style="margin:24px 0"><a href="${link}" style="background:${ORANGE};color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;display:inline-block">Sign in</a></p>
     <p style="font-size:13px;color:#7a8290">If you didn't request this, you can ignore this email.</p>`,
  );
  await send(email, 'Your Teleforce sign-in link', html);
}

export async function sendSwitchConfirmation(
  email: string,
  d: { eaName?: string | null; commitmentEnd: string; rate: string },
) {
  const html = wrap(
    'Your plan is now on a 12-month term',
    `<p>Your Executive Assistant plan${d.eaName ? ` (${d.eaName})` : ''} has been amended to a 12-month initial period, effective today, at ${d.rate}/month.</p>
     <p>Initial term ends: <strong>${new Date(d.commitmentEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. All other terms are unchanged.</p>`,
  );
  await send(email, 'Plan updated to 12-month', html);
}

export async function sendAddEaConfirmation(
  email: string,
  d: { name: string; start?: string },
) {
  const html = wrap(
    'We received your request for another EA',
    `<p>Thanks — we've received your request to add an executive assistant${d.name ? ` for ${d.name}` : ''}. This is an additional order under your existing agreement.</p>
     <p>You won't be charged until the new EA starts. We'll reach out to confirm the match and kickoff date${d.start ? ` (you asked for ~${d.start})` : ''}.</p>`,
  );
  await send(email, 'Request received: additional EA', html);
}

export async function notifyOps(subject: string, lines: Record<string, string>) {
  const rows = Object.entries(lines)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#7a8290;vertical-align:top">${k}</td><td style="padding:4px 0"><strong>${String(v).replace(/\n/g, '<br/>')}</strong></td></tr>`,
    )
    .join('');
  const html = wrap(subject, `<table style="font-size:14px">${rows}</table>`);
  await send(OPS(), `[Portal] ${subject}`, html);
}
