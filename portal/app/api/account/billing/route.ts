import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserById, updateBilling } from '@/lib/users';
import { asRecord, normalizeEmail, normalizeName, normalizeOptional } from '@/lib/validate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const record = asRecord(body);
  const contactRaw = String(record.contactName ?? '');
  const company = normalizeOptional(String(record.company ?? ''), 160);
  const address = normalizeOptional(String(record.address ?? '').replace(/\s+/g, ' '), 400);
  const emailRaw = String(record.email ?? '').trim();
  const contact = contactRaw.trim() ? normalizeName(contactRaw) : '';
  const billingEmail = emailRaw ? normalizeEmail(emailRaw) : '';

  if (contactRaw.trim() && !contact) {
    return NextResponse.json({ error: 'Enter a billing contact name.' }, { status: 400 });
  }
  if (company == null || address == null) {
    return NextResponse.json({ error: 'Check the billing fields and try again.' }, { status: 400 });
  }
  if (emailRaw && !billingEmail) {
    return NextResponse.json({ error: 'Enter a valid billing email.' }, { status: 400 });
  }

  await updateBilling(user.id, {
    company,
    billingContact: contact || '',
    billingEmail: billingEmail || '',
    billingAddress: address,
  });

  return NextResponse.json({ ok: true });
}
