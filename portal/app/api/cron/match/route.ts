import { NextRequest, NextResponse } from 'next/server';
import { runMatchCron } from '@/lib/match-cron';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Vercel Cron and the GitHub Action both send `Authorization: Bearer <CRON_SECRET>`.
 * An empty secret keeps the route closed.
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim() || '';
  if (!secret) return false;
  const header = (req.headers.get('authorization') || '').trim();
  return header === `Bearer ${secret}`;
}

async function run(req: NextRequest): Promise<NextResponse> {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runMatchCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('match cron failed', err instanceof Error ? err.message : 'error');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export function GET(req: NextRequest): Promise<NextResponse> {
  return run(req);
}

export function POST(req: NextRequest): Promise<NextResponse> {
  return run(req);
}
