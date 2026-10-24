import type { EaAdminRow, EaLinkPreview } from '@/lib/ea';
import { assistantNameKey } from '@/lib/ea';
import EaLinkConfirm from './EaLinkConfirm';

function optionLabel(account: EaAdminRow): string {
  const who = `${account.fullName} · ${account.email}`;
  return account.client ? `${who} · ${account.client.fullName || 'Client'}` : who;
}

export default function EaAssign({
  userId,
  matchedName,
  accounts,
  linked,
  confirm,
}: {
  userId: string;
  matchedName: string;
  accounts: EaAdminRow[];
  linked: EaAdminRow | null;
  confirm: EaLinkPreview | null;
}) {
  const matchKey = assistantNameKey(matchedName);
  const suggested = accounts.find((account) => assistantNameKey(account.fullName) === matchKey);

  return (
    <section className="card" id="ea-login">
      <h2>EA login</h2>
      <p className="hint">
        An assistant is dedicated to one client.
        {matchedName ? ` The match name is ${matchedName}.` : ' Publish a match name first if you want the name to suggest an account.'}
      </p>
      {confirm && <EaLinkConfirm preview={confirm} />}
      {linked ? (
        <>
          <p className="hint">{linked.fullName} · {linked.email}{linked.hasPassword ? '' : ' · invite not used yet'}</p>
          <form action="/api/admin/ea-link" method="post">
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="intent" value="unlink" />
            <button className="btn btn-ghost" type="submit">Remove EA login</button>
          </form>
        </>
      ) : (
        <p className="hint">No assistant login is linked.</p>
      )}
      {accounts.length === 0 ? (
        <p className="hint"><a href="/admin/eas">Create an assistant account</a></p>
      ) : (
        <form action="/api/admin/ea-link" method="post" className="task-admin-row">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="intent" value="link" />
          <label className="muted" htmlFor="eaId">Assistant</label>
          <select id="eaId" name="eaId" defaultValue={suggested?.id || linked?.id || ''}>
            <option value="">Choose one</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{optionLabel(account)}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-tiny" type="submit">Link</button>
        </form>
      )}
    </section>
  );
}
