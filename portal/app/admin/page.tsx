import { formatDate } from '@/lib/money';
import { describeMatch, listClientsForAdmin } from '@/lib/match';
import { planLabel } from '@/lib/plans';

export const dynamic = 'force-dynamic';

function notice(code?: string): string {
  if (code === 'onboarding') return 'Onboarding marked complete.';
  if (code === 'kickoff') return 'Kickoff marked done.';
  if (code === 'departure') return 'Departure recorded. It does not count as a client rematch.';
  return '';
}

function problem(code?: string): string {
  if (code === 'missing') return 'That client was not found.';
  if (code === 'kickoff') return 'Kickoff can be marked done after the client accepts the match.';
  if (code === 'save') return 'That update didn’t save. Try again.';
  return '';
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { notice?: string; error?: string };
}) {
  const clients = await listClientsForAdmin();
  const ok = notice(searchParams?.notice);
  const err = problem(searchParams?.error);

  return (
    <>
      <h1 className="page-title display">Clients</h1>
      <p className="page-sub">
        Publish a match to email the client and show Meet your EA. Mark onboarding and kickoff here.
        The assistant name is written to the account when you publish.
      </p>
      {ok && <p className="note ok" role="status">{ok}</p>}
      {err && <p className="note err" role="alert">{err}</p>}
      {clients.length === 0 && <p className="hint">No client accounts yet.</p>}
      {clients.map((client) => {
        const onboarding = client.onboardingCompletedAt
          ? `Complete · ${formatDate(client.onboardingCompletedAt)}`
          : 'Not complete';
        const accepted = client.matchAcceptedAt ? formatDate(client.matchAcceptedAt) : '—';
        const canKickoff = Boolean(client.matchAcceptedAt) && !client.kickoffCompletedAt;
        return (
          <section className="card" key={client.id}>
            <h2>{client.fullName || client.email}</h2>
            <p className="hint admin-email">{client.email}</p>
            <div className="kv">
              <span className="k">Plan</span>
              <span className="v">{planLabel(client.plan)}</span>
              <span className="k">Signed up</span>
              <span className="v">{formatDate(client.createdAt)}</span>
              <span className="k">Onboarding</span>
              <span className="v">{onboarding}</span>
              <span className="k">Match</span>
              <span className="v">{describeMatch(client)}</span>
              <span className="k">Accepted</span>
              <span className="v">{accepted}</span>
              <span className="k">Introductions</span>
              <span className="v">{client.hasPackage ? client.presentation : '—'}</span>
              <span className="k">Declines</span>
              <span className="v">{client.declines}</span>
              <span className="k">Rematches</span>
              <span className="v">{client.rematches} of 1 this year</span>
              <span className="k">Departures</span>
              <span className="v">{client.departures}</span>
            </div>
            <div className="admin-actions">
              <a className="btn btn-primary" href={`/admin/${client.id}`}>
                Edit match
              </a>
              {!client.onboardingCompletedAt && (
                <form action="/api/admin/onboarding" method="post">
                  <input type="hidden" name="userId" value={client.id} />
                  <button className="btn btn-ghost" type="submit">
                    Mark onboarding complete
                  </button>
                </form>
              )}
              {canKickoff && (
                <form action="/api/admin/kickoff" method="post">
                  <input type="hidden" name="userId" value={client.id} />
                  <button className="btn btn-ghost" type="submit">
                    Mark kickoff done
                  </button>
                </form>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}
