import EaLinkConfirm from '@/app/components/EaLinkConfirm';
import {
  clientsMatchingAssistantName,
  linkReplaces,
  listClientChoices,
  listEaAdminRows,
  previewEaLink,
  type ClientChoice,
} from '@/lib/ea';
import { formatDate } from '@/lib/money';
import { isUserId } from '@/lib/match';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function clientLabel(client: ClientChoice): string {
  return client.company ? `${client.fullName || client.id} · ${client.company}` : (client.fullName || client.id);
}

function banner(query: { notice?: string; mail?: string; linked?: string; matches?: string; link?: string; pending?: string }): string {
  const sent = query.mail === 'sent' ? ' The invite email went out.' : ' Copy the link. The email did not send.';
  if (query.notice === 'created') {
    let extra = '';
    if (query.link === '1' && query.linked === '1') extra = ' Linked to the one client with this name.';
    else if (query.link === '1' && query.pending) extra = ' That client already has an assistant. Confirm the replacement below.';
    else if (query.link === '1' && Number(query.matches) > 1) extra = ' More than one client uses this name. Pick one below.';
    else if (query.link === '1') extra = ' No client with this name to link.';
    return `Assistant account created.${extra}${sent}`;
  }
  if (query.notice === 'invite') return `A new set-password link is ready.${sent}`;
  if (query.notice === 'linked') return 'Assistant linked. They’ll see this client’s tasks.';
  if (query.notice === 'unlinked') return 'Client removed from this assistant.';
  return '';
}

function problem(code?: string): string {
  if (code === 'email') return 'Enter a work email.';
  if (code === 'name') return 'Enter the assistant’s first and last name.';
  if (code === 'exists') return 'That email is already a client or an assistant.';
  if (code === 'missing') return 'That assistant was not found.';
  if (code === 'ea') return 'That link didn’t save. Try again.';
  if (code === 'save') return 'That didn’t save. Try again.';
  return '';
}

export default async function AdminEasPage({
  searchParams,
}: {
  searchParams: {
    notice?: string;
    error?: string;
    mail?: string;
    linked?: string;
    matches?: string;
    link?: string;
    pending?: string;
    ea?: string;
    confirm?: string;
    user?: string;
  };
}) {
  const rows = await listEaAdminRows();
  const choices = await listClientChoices();
  const ok = banner(searchParams || {});
  const err = problem(searchParams?.error);
  const focus = rows.find((row) => row.id === searchParams?.ea);
  const pendingId = isUserId(searchParams?.pending || '') ? searchParams.pending || '' : '';
  const confirmUser = isUserId(searchParams?.user || '') ? searchParams.user || '' : '';
  const confirmEa = UUID.test(searchParams?.ea || '') ? searchParams.ea || '' : '';
  const confirm = searchParams?.confirm === '1' && confirmEa && confirmUser
    ? await previewEaLink(confirmEa, confirmUser)
    : null;
  const pending = focus && pendingId ? await previewEaLink(focus.id, pendingId) : null;
  const nameMatches = focus && searchParams?.link === '1' && Number(searchParams?.matches) > 1
    ? await clientsMatchingAssistantName(focus.fullName)
    : [];

  return (
    <>
      <p className="page-sub" style={{ marginBottom: 8 }}>
        <a href="/admin">All clients</a>
      </p>
      <h1 className="page-title display">Assistants</h1>
      <p className="page-sub">
        Each assistant is dedicated to one client. Linking a new client replaces the previous one after you confirm.
      </p>
      {ok && <p className="note ok" role="status">{ok}</p>}
      {err && <p className="note err" role="alert">{err}</p>}
      {confirm && linkReplaces(confirm) && <EaLinkConfirm preview={confirm} returnTo="eas" />}
      {pending && linkReplaces(pending) && !confirm && <EaLinkConfirm preview={pending} returnTo="eas" />}
      {focus?.inviteUrl && (
        <section className="card">
          <h2>Set-password link</h2>
          <p className="hint">{focus.fullName} · {focus.email}. Expires {formatDate(focus.inviteExpiresAt)}.</p>
          <input className="cal-url" readOnly value={focus.inviteUrl} spellCheck={false} aria-label="Set-password link" />
        </section>
      )}
      {nameMatches.length > 1 && focus && (
        <form action="/api/admin/ea-link" method="post" className="card" id="ea-name-pick">
          <h2>Pick one client</h2>
          <p className="hint">{focus.fullName} matches more than one client. Choose one.</p>
          <input type="hidden" name="intent" value="link" />
          <input type="hidden" name="returnTo" value="eas" />
          <input type="hidden" name="eaId" value={focus.id} />
          <div className="task-admin-row">
            <label className="muted" htmlFor="matchUserId">Client</label>
            <select id="matchUserId" name="userId" defaultValue="">
              <option value="">Choose one</option>
              {nameMatches.map((client) => (
                <option key={client.id} value={client.id}>{clientLabel(client)}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-tiny" type="submit">Link</button>
          </div>
        </form>
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
          <span>Link the client matched to this name when there is exactly one.</span>
        </label>
        <button className="btn btn-primary" type="submit">Create invite link</button>
      </form>

      {rows.length === 0 && <p className="hint">No assistant accounts yet.</p>}
      {rows.map((row) => (
        <section className="card" key={row.id}>
          <h2>{row.fullName}</h2>
          <p className="hint admin-email">{row.email}</p>
          <p className="hint">{row.hasPassword ? 'Password set.' : 'Waiting on the set-password link.'}</p>
          <p className="hint">{row.client ? `Client: ${row.client.fullName || 'Client'}` : 'No client linked.'}</p>
          {choices.length > 0 && (
            <form action="/api/admin/ea-link" method="post" className="task-admin-row">
              <input type="hidden" name="intent" value="link" />
              <input type="hidden" name="returnTo" value="eas" />
              <input type="hidden" name="eaId" value={row.id} />
              <label className="muted" htmlFor={`client-${row.id}`}>Client</label>
              <select id={`client-${row.id}`} name="userId" defaultValue={row.client?.id || ''}>
                <option value="">Choose one</option>
                {choices.map((client) => (
                  <option key={client.id} value={client.id}>{clientLabel(client)}</option>
                ))}
              </select>
              <button className="btn btn-ghost btn-tiny" type="submit">Link</button>
            </form>
          )}
          {row.client && (
            <form action="/api/admin/ea-link" method="post">
              <input type="hidden" name="intent" value="unlink" />
              <input type="hidden" name="returnTo" value="eas" />
              <input type="hidden" name="userId" value={row.client.id} />
              <button className="btn btn-ghost" type="submit">Remove client</button>
            </form>
          )}
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
