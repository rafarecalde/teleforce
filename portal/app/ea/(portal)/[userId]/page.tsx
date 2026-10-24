import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { clientForEa, getEaById } from '@/lib/ea';
import { isUserId } from '@/lib/match';

export const dynamic = 'force-dynamic';

/** Older links pointed at a client id. The assistant has one client, on /ea. */
export default async function EaClientRedirect({ params }: { params: { userId: string } }) {
  if (!isUserId(params.userId)) notFound();
  const session = await getSession();
  const ea = session?.role === 'ea' ? await getEaById(session.userId) : null;
  if (!ea) return null;
  const client = await clientForEa(ea.id);
  if (!client || client.id !== params.userId) notFound();
  redirect('/ea');
}
