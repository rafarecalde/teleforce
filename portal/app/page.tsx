import { getSession } from '@/lib/auth';
import { stripe, getLiveSubscriptions, getPrice, subPrice } from '@/lib/stripe';
import { formatDate, formatMoney, addMonthsISO } from '@/lib/money';
import LoginForm from './login-form';
import PlanCard, { toPlanView } from './components/PlanCard';
import SwitchTo12 from './components/SwitchTo12';
import SeatRequest from './components/SeatRequest';
import AddEaForm from './components/AddEaForm';
import BillingInfo, { type BillingView } from './components/BillingInfo';

export const dynamic = 'force-dynamic';

function Shell({ children, signedIn }: { children: React.ReactNode; signedIn: boolean }) {
  return (
    <>
      <header className="topbar">
        <div className="row">
          <span className="brand">
            <span className="dot" />
            TELEFORCE
          </span>
          {signedIn && (
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="mono"
                style={{ background: 'none', border: 'none', color: '#cdd6e2', cursor: 'pointer', fontSize: 12.5 }}
              >
                Sign out
              </button>
            </form>
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
  searchParams: { error?: string };
}) {
  const session = await getSession();

  // ── Not signed in → login ─────────────────────────────────────────────────
  if (!session) {
    const initialError =
      searchParams?.error === 'link_invalid'
        ? 'That sign-in link is invalid or expired. Request a new one below.'
        : undefined;
    return (
      <Shell signedIn={false}>
        <div className="login">
          <section className="card">
            <h1 className="display">Client account</h1>
            <p className="page-sub" style={{ marginBottom: 18 }}>
              Sign in to manage your Executive Assistant plan and billing.
            </p>
            <LoginForm initialError={initialError} />
          </section>
        </div>
      </Shell>
    );
  }

  // ── Signed in → load everything from Stripe ───────────────────────────────
  const [subs, price3, price12] = await Promise.all([
    getLiveSubscriptions(session.cid),
    getPrice(process.env.STRIPE_PRICE_3MO ?? ''),
    getPrice(process.env.STRIPE_PRICE_12MO ?? ''),
  ]);

  const monthlySavingsMinor =
    (price3.unit_amount ?? 0) - (price12.unit_amount ?? 0);
  const currency = price12.currency ?? 'usd';
  const rate12 = formatMoney(price12.unit_amount, currency);
  const monthlySavings = formatMoney(monthlySavingsMinor, currency);
  const annualSavings = formatMoney(monthlySavingsMinor * 12, currency);
  const commitmentEndPreview = formatDate(addMonthsISO(12));

  const threeMonthSubs = subs.filter((s) => (s.metadata?.term ?? '') === '3');

  // Billing
  const customer = await stripe.customers.retrieve(session.cid, {
    expand: ['invoice_settings.default_payment_method'],
  });
  const billing: BillingView = {
    cardBrand: null,
    last4: null,
    nextChargeDate: '—',
    nextChargeAmount: '—',
    billingEmail: session.email,
  };
  if (customer && !customer.deleted) {
    billing.billingEmail = customer.email ?? session.email;
    const dpm = customer.invoice_settings?.default_payment_method;
    if (dpm && typeof dpm === 'object' && dpm.card) {
      billing.cardBrand = dpm.card.brand;
      billing.last4 = dpm.card.last4;
    } else {
      const pms = await stripe.paymentMethods.list({ customer: session.cid, type: 'card', limit: 1 });
      const pm = pms.data[0];
      if (pm?.card) {
        billing.cardBrand = pm.card.brand;
        billing.last4 = pm.card.last4;
      }
    }
  }
  try {
    const up = await stripe.invoices.retrieveUpcoming({ customer: session.cid });
    billing.nextChargeAmount = formatMoney(up.amount_due, up.currency);
    billing.nextChargeDate = formatDate(up.next_payment_attempt ?? up.period_end);
  } catch {
    const first = subs[0];
    if (first) {
      const p = subPrice(first);
      billing.nextChargeAmount = formatMoney(p?.unit_amount, p?.currency ?? 'usd');
      billing.nextChargeDate = formatDate(first.current_period_end);
    }
  }

  return (
    <Shell signedIn={true}>
      <h1 className="page-title display">Your account</h1>
      <p className="page-sub">Signed in as {session.email}</p>

      {/* 1 — Your plan */}
      <section className="card">
        <h2>Your plan</h2>
        {subs.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>
            No active plan yet. Your account manager will set this up at kickoff.
          </p>
        ) : (
          subs.map((s) => <PlanCard key={s.id} plan={toPlanView(s)} />)
        )}
      </section>

      {/* 2 — Increase your plan */}
      <section className="card">
        <h2>Increase your plan</h2>
        <p className="hint">Move to the better rate, or add a support seat.</p>

        {threeMonthSubs.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>
            You&apos;re already on the 12-month rate — the best price.
          </p>
        ) : (
          threeMonthSubs.map((s, i) => (
            <div key={s.id} style={{ marginBottom: i < threeMonthSubs.length - 1 ? 18 : 0 }}>
              {threeMonthSubs.length > 1 && (
                <p className="mono" style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 6px' }}>
                  {s.metadata?.ea_name || 'EA'}
                </p>
              )}
              <SwitchTo12
                subscriptionId={s.id}
                rate12={rate12}
                monthlySavings={monthlySavings}
                annualSavings={annualSavings}
                commitmentEndPreview={commitmentEndPreview}
              />
            </div>
          ))
        )}

        <hr className="divider" />
        <p className="subhead">Add a support seat</p>
        <p className="muted" style={{ fontSize: 13.5, margin: '0 0 12px' }}>
          Beyond your EA — request customer service or SDR coverage. No charge; we&apos;ll scope it
          with you first.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <SeatRequest type="customer_service" label="Customer service seat" />
          <SeatRequest type="sdr" label="SDR seat" />
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
        <BillingInfo billing={billing} />
      </section>
    </Shell>
  );
}
