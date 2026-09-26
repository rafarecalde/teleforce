import { NextRequest } from 'next/server';
import { json, jsonError, originAllowed, preflight } from '@/lib/http';
import { publishableKey } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export function GET(req: NextRequest) {
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed.' }, 403);
  try {
    return json(req, { publishableKey: publishableKey() });
  } catch (err) {
    return jsonError(req, err, 'Card form is not configured yet.');
  }
}
