import { NextRequest } from 'next/server';
import { json, jsonError, originAllowed, preflight } from '@/lib/http';
import { leadIsHoneypot, parseSalesLead, sendSalesLead } from '@/lib/lead-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return json(req, { success: false, error: 'Origin not allowed.' }, 403);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(req, { success: false, error: 'That form could not be sent.' }, 400);
  }
  if (leadIsHoneypot(body)) return json(req, { success: true });
  try {
    const lead = parseSalesLead(body);
    await sendSalesLead(lead);
    return json(req, { success: true });
  } catch (err) {
    return jsonError(req, err, 'That form could not be sent.');
  }
}
