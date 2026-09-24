import { getSession, type Principal } from '@/lib/auth';
import { addMonthsISO, formatDate } from '@/lib/money';
import { DEMO } from '@/lib/demo';
import PlanCard from './components/PlanCard';
import SwitchTo12 from './components/SwitchTo12';
import SeatRequest from './components/SeatRequest';
import AddEaForm from './components/AddEaForm';
import BillingInfo from './components/BillingInfo';

export const dynamic = 'force-dynamic';

function Shell({
  children,
  signedIn,
  company,
}: {
  children: React.ReactNode;
  signedIn: boolean;
  company?: string;
}) {
  return (
    <>
      <header className="topbar">
        <div className="row">
          <span className="brand">
            <span className="dot" />
            TELEFORCE
            <span className="preview-tag">Preview</span>
          </span>
          {signedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {company && <span className="mono" style={{ fontSize: 12, color: 'var(--on-dark-mut)' }}>{company}</span>}
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="mono"
                  style={{ background: 'none', border: 'none', color: 'var(--on-dark-mut)', cursor: 'pointer', fontSize: 12.5 }}
                >
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </header>
      <main>
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: { name?: string; company?: string; email?: string; error?: string };
}) {
  // Persona = an established session, or one passed by query params (so a rep can
  // open a personalized link on a sales call, e.g. ?company=Acme&name=Jane).
  const session = await getSession();
  const fromQuery: Principal | null =
    searchParams?.email || searchParams?.name || searchParams?.company
      ? {
          email: searchParams.email || 'client@example.com',
          name: searchParams.name,
          company: searchParams.company,
        }
      : null;
  const persona = session ?? fromQuery;

  // ── Sign in ────────────────────────────────────────────────────────────────
  if (!persona) {
    const needsPasscode = !!process.env.PORTAL_PASSCODE;
    const err =
      searchParams?.error === 'passcode'
        ? 'That passcode is incorrect.'
        : searchParams?.error === 'email'
          ? 'Enter an email to continue.'
          : '';
    return (
      <Shell signedIn={false}>
        <div className="login">
          <section className="card">
            <h1 className="display">Client account</h1>
            <p className="page-sub" style={{ marginBottom: 18 }}>
              Sign in to manage your Executive Assistant plan and billing.
            </p>
            <form action="/api/auth/login" method="post">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" placeholder="you@company.com" required />
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="name">Your name</label>
                  <input id="name" name="name" placeholder="Optional" />
                </div>
                <div className="field">
                  <label htmlFor="company">Company</label>
                  <input id="company" name="company" placeholder="Optional" />
                </div>
              </div>
              {needsPasscode && (
                <div className="field">
                  <label htmlFor="passcode">Access passcode</label>
                  <input id="passcode" name="passcode" placeholder="From your invite" />
                </div>
              )}
              <button className="btn btn-primary btn-full" type="submit">
                Continue
              </button>
              {err && (
                <div className="note err" role="alert">
                  {err}
                </div>
              )}
              <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
                No passwords — in the live portal we email you a secure, one-time sign-in link.
              </p>
            </form>
          </section>
        </div>
      </Shell>
    );
  }

  // ── Signed in → personalized demo account ──────────────────────────────────
  const plans = DEMO.plans;
  const threeMonth = plans.filter((p) => p.term === '3');
  const commitmentEndPreview = formatDate(addMonthsISO(12));
  const displayName = persona.name || persona.company || persona.email;

  const billingInit = {
    contactName: persona.name || DEMO.billing.contactName,
    company: persona.company || DEMO.billing.company,
    email: persona.email || DEMO.billing.email,
    address: DEMO.billing.address,
    cardBrand: DEMO.billing.cardBrand,
    cardLast4: DEMO.billing.cardLast4,
  };

  return (
    <Shell signedIn={true} company={persona.company}>
      <h1 className="page-title display">Welcome back, {firstName(displayName)}.</h1>
      <p className="page-sub">Signed in as {persona.email}</p>

      {/* 1 — Your plan */}
      <section className="card">
        <h2>Your plan</h2>
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </section>

      {/* 2 — Increase your plan */}
      <section className="card">
        <h2>Increase your plan</h2>
        <p className="hint">Move to the better rate, or add a support seat.</p>
        {threeMonth.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>You&apos;re already on the 12-month rate — the best price.</p>
        ) : (
          <SwitchTo12
            rate12={threeMonth[0].rate12}
            monthlySavings={threeMonth[0].monthlySavings}
            annualSavings={threeMonth[0].annualSavings}
            commitmentEndPreview={commitmentEndPreview}
          />
        )}
        <hr className="divider" />
        <p className="subhead">Add a support seat</p>
        <p className="muted" style={{ fontSize: 13.5, margin: '0 0 12px' }}>
          Beyond your EA — request customer service or SDR coverage. No charge; we scope it with you
          first.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <SeatRequest label="Customer service seat" />
          <SeatRequest label="SDR seat" />
        </div>
      </section>

      {/* 3 — Add another EA */}
      <section className="card">
        <h2>Add another EA</h2>
        <p className="hint">
          Request a second executive assistant. This is an additional order under your existing
          agreement — no charge until the new EA starts.
        </p>
        <AddEaForm />
      </section>

      {/* 4 — Billing information */}
      <section className="card">
        <h2>Billing information</h2>
        <BillingInfo init={billingInit} />
      </section>
    </Shell>
  );
}

function firstName(s: string): string {
  if (s.includes('@')) return s.split('@')[0];
  return s.split(' ')[0];
}
