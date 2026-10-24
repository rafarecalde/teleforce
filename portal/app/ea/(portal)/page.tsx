import EaTasks from '@/app/components/EaTasks';
import { getSession } from '@/lib/auth';
import { clientForEa, getEaById } from '@/lib/ea';
import { loadTaskBoard } from '@/lib/tasks';

export const dynamic = 'force-dynamic';

export default async function EaHomePage({
  searchParams,
}: {
  searchParams: { notice?: string; error?: string };
}) {
  const session = await getSession();
  const ea = session?.role === 'ea' ? await getEaById(session.userId) : null;
  if (!ea) return null;
  const client = await clientForEa(ea.id);
  if (!client) {
    return (
      <div id="ea-empty">
        <h1 className="page-title display">You'll see your client here once matched</h1>
      </div>
    );
  }

  const board = await loadTaskBoard(client.id);
  const name = client.fullName || client.email;
  return (
    <div id="ea-landing">
      <h1 className="page-title display">{name}</h1>
      {client.company && <p className="page-sub">{client.company}</p>}
      {searchParams?.notice === 'saved' && <p className="note ok" role="status">Saved.</p>}
      {searchParams?.error === 'task' && (
        <p className="note err" role="alert">That didn’t save. Check the status or comment and try again.</p>
      )}
      {searchParams?.error === 'missing' && (
        <p className="note err" role="alert">That client isn’t yours.</p>
      )}
      <EaTasks userId={client.id} clientName={name} board={board} />
    </div>
  );
}
