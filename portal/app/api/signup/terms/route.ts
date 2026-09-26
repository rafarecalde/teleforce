import { NextRequest } from 'next/server';
import { json, jsonError, originAllowed, preflight } from '@/lib/http';
import { getTermsDocument } from '@/lib/terms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export function GET(req: NextRequest) {
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed.' }, 403);
  try {
    const terms = getTermsDocument();
    return json(req, {
      termsVersion: terms.version,
      termsContentHash: terms.contentHash,
    });
  } catch (err) {
    return jsonError(req, err, 'Terms are unavailable. Try again.');
  }
}
