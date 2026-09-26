import { NextRequest } from 'next/server';
import { json, jsonError, originAllowed, preflight, requestEvidence } from '@/lib/http';
import { completeSignup } from '@/lib/signup';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed.' }, 403);
  try {
    const body = await req.json();
    return json(req, await completeSignup(body, requestEvidence(req)));
  } catch (err) {
    return jsonError(req, err, 'Could not create the account. Try again.');
  }
}
