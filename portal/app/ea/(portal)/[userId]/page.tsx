import { notFound } from 'next/navigation';
import EaTasks from '@/app/components/EaTasks';
import { getSession } from '@/lib/auth';
import { eaCanAccessClient, getEaById } from '@/lib/ea';
import { isUserId } from '@/lib/match';
import { loadTaskBoard } from '@/lib/tasks';
import { getUserById } from '@/lib/users';

export const dynamic = 'force-dynamic';

export default async function EaClientPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { notice?: string; error?: string };
}) {
  if (!isUserId(params.userId)) notFound();
  const session = await getSession();
  const ea = session?.role === 'ea' ? await getEaById(session.userId) : null;
  if (!ea) return null;
  if (!(await eaCanAccessClient(ea.id, params.userId))) notFound();
  const user = await getUserById(params.userId);
  if (!user) notFound();
  const board = await loadTaskBoard(user.id);
  const name = user.fullName || user.email;

  return (
    <>
      <p className="page-sub" style={{ marginBottom: 8 }}>
        <a href="/ea">Your clients</a>
      </p>
      <h1 className="page-title display">{name}</h1>
      {user.company && <p className="page-sub">{user.company}</p>}
      {searchParams?.notice === 'saved' && <p className="note ok" role="status">Saved.</p>}
      {searchParams?.error === 'task' && (
        <p className="note err" role="alert">That didn’t save. Check the status or comment and try again.</p>
      )}
      <EaTasks userId={user.id} clientName={name} board={board} />
    </>
  );
}
