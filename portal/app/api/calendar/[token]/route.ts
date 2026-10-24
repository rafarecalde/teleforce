import { NextRequest, NextResponse } from 'next/server';
import { icsForToken, isFeedToken } from '@/lib/tasks';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  if (!isFeedToken(params.token)) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const ics = await icsForToken(params.token);
    if (!ics) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="teleforce-tasks.ics"',
        'Cache-Control': 'private, max-age=300',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (err) {
    console.error('calendar feed failed', err instanceof Error ? err.message : 'error');
    return new NextResponse('Unavailable', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
