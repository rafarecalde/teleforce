import { formatDate } from '@/lib/money';
import { listEaAdminRows } from '@/lib/ea';

export const dynamic = 'force-dynamic';

function banner(notice?: string, mail?: string, linked?: string): string {
  const sent = mail === 'sent' ? ' The invite email went out.' : ' Copy the link. The email did not send.';
  if (notice === 'created') {
    const count = Number(linked || 0);
    const clients = count === 1 ? ' 1 client with this name was linked.' : count > 1 ? ` ${count} clients with this name were linked.` : '';
    return `Assistant account created.${clients}${sent}`;
  }
  if (notice === 'invite') return `A new set-password link is ready.${sent}`;
  return '';
}

function problem(code?: string): string {
  if (code === 'email') return 'Enter a work email.';
  if (code === 'name') return 'Enter the assistant’s first and last name.';
  if (code === 'exists') return 'That email is already a client or an assistant.';
  if (code === 'missing') return 'That assistant was not found.';
  if (code === 'save') return 'That didn’t save. Try again.';
  return '';
}

export default async function AdminEasPage({
  searchParams,
}: {
  searchParams: { notice?: string; error?: string; mail?: string; linked?: string; ea?: string };
}) {
  const rows = await listEaAdminRows();
  const ok = banner(searchParams?.notice, searchParams?.mail, searchParams?.linked);
  const err = problem(searchParams?.error);
  const focus = rows.find((row) => row.id === searchParams?.ea);

  return (
    <>
      <p className="page-sub" style={{ marginBottom: 8 }}>
        <a href="/admin">All clients</a>
      </p>
      <h1 className="page-title display">Assistants</h1>
      <p className="page-sub">
        An assistant signs in with this email and sees only the clients linked to them.
        Linking uses the assistant name already on the match.
      </p>
      {ok && <p className="note ok" role="status">{ok}</p>}
      {err && <p className="note err" role="alert">{err}</p>}
      {focus?.inviteUrl && (
        <section className="card">
          <h2>Set-password link</h2>
          <p className="hint">{focus.fullName} · {focus.email}. Expires {formatDate(focus.inviteExpiresAt)}.</p>
          <input className="cal-url" readOnly value={focus.inviteUrl} spellCheck={false} aria-label="Set-password link" />
        </section>
      )}

      <form action="/api/admin/eas" method="post" className="card" autoComplete="off">
        <h2>New assistant</h2>
        <input type="hidden" name="intent" value="create" />
        <div className="field">
          <label htmlFor="fullName">Name</label>
          <input id="fullName" name="fullName" required maxLength={120} placeholder="First Last" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required maxLength={254} placeholder="name@company.com" />
        </div>
        <label className="ack">
          <input type="checkbox" name="linkByName" value="1" defaultChecked />
          <span>Link clients already matched to this name.</span>
        </label>
        <button className="btn btn-primary" type="submit">Create invite link</button>
      </form>

      {rows.length === 0 && <p className="hint">No assistant accounts yet.</p>}
      {rows.map((row) => (
        <section className="card" key={row.id}>
          <h2>{row.fullName}</h2>
          <p className="hint admin-email">{row.email}</p>
          <p className="hint">{row.hasPassword ? 'Password set.' : 'Waiting on the set-password link.'}</p>
          <p className="hint">
            {row.clients.length === 0
              ? 'No clients linked.'
              : row.clients.map((client) => client.fullName || 'Client').join(', ')}
          </p>
          <form action="/api/admin/eas" method="post">
            <input type="hidden" name="intent" value="invite" />
            <input type="hidden" name="eaId" value={row.id} />
            <button className="btn btn-ghost" type="submit">New set-password link</button>
          </form>
        </section>
      ))}
    </>
  );
}
