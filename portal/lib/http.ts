import { NextResponse } from 'next/server';

const DEFAULT_ORIGINS = [
  'https://tryteleforce.com',
  'https://www.tryteleforce.com',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function allowedOrigins(): string[] {
  const extra = (process.env.SIGNUP_CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...DEFAULT_ORIGINS, ...extra];
}

/** Missing Origin is allowed (non-browser clients). Browsers send Origin on cross-site calls. */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  return allowedOrigins().includes(origin);
}

export function corsHeaders(req: Request): Headers {
  const headers = new Headers();
  const origin = req.headers.get('origin');
  if (origin && allowedOrigins().includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Vary', 'Origin');
  }
  headers.set('Cache-Control', 'no-store');
  return headers;
}

export function json(req: Request, body: unknown, status = 200): NextResponse {
  const headers = corsHeaders(req);
  headers.set('Content-Type', 'application/json');
  return new NextResponse(JSON.stringify(body), { status, headers });
}

export function preflight(req: Request): NextResponse {
  if (!originAllowed(req)) {
    return new NextResponse(null, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export function jsonError(req: Request, err: unknown, fallback: string): NextResponse {
  if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
  console.error(fallback, err instanceof Error ? err.message : 'error');
  return json(req, { error: fallback }, 500);
}
