import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireUser } from '@/lib/account-session';
import { insertEaRequest, parseEaRequest } from '@/lib/ea-requests';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    const input = parseEaRequest(user.id, body);
    const saved = await insertEaRequest(input);
    console.info('ea request stored', saved.id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return accountError(err, 'Could not save the EA request. Try again.');
  }
}
