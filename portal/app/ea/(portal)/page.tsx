import { getSession } from '@/lib/auth';
import { getEaById, listClientsForEa } from '@/lib/ea';

export const dynamic = 'force-dynamic';

export default async function EaHomePage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await getSession();
  const ea = session?.role === 'ea' ? await getEaById(session.userId) : null;
  if (!ea) return null;
  const clients = await listClientsForEa(ea.id);
  const first = ea.fullName.split(' ')[0] || ea.fullName;

  return (
    <div id="ea-home">
      <h1 className="page-title display">Your clients</h1>
      <p className="page-sub">Hi {first}. These are the clients matched to you.</p>
      {searchParams?.error === 'missing' && (
        <p className="note err" role="alert">That client isn’t on your list.</p>
      )}
      {clients.length === 0 && (
        <section className="card">
          <p className="hint">No clients are linked yet. Your Partnership Manager connects them after the match.</p>
        </section>
      )}
      {clients.map((client) => (
        <section className="card" key={client.id}>
          <h2>{client.fullName || client.email}</h2>
          {client.company && <p className="hint">{client.company}</p>}
          <p className="hint">{client.openTasks === 1 ? '1 open task' : `${client.openTasks} open tasks`}</p>
          <p className="meet-actions">
            <a className="btn btn-primary" href={`/ea/${client.id}`}>Open tasks</a>
          </p>
        </section>
      ))}
    </div>
  );
}
