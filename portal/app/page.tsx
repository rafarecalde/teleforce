import { getSession } from '@/lib/auth';
import { addMonthsISO, formatDate } from '@/lib/money';
import { DEMO, type DemoPlan } from '@/lib/demo';
import { formatDollars, PLAN_PRICE_12, PLAN_PRICE_3, planMonthly } from '@/lib/plans';
import { retrieveCard } from '@/lib/stripe';
import { getUserById, hasCardOnFile, type User } from '@/lib/users';
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
  preview,
}: {
  children: React.ReactNode;
  signedIn: boolean;
  company?: string;
  preview?: boolean;
}) {
  return (
    <>
      <header className="topbar">
        <div className="row">
          <span className="brand">
            <span className="dot" />
            TELEFORCE
            {preview && <span className="preview-tag">Preview</span>}
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

function loginMessage(error?: string): string {
  if (error === 'credentials') return 'Email or password is incorrect.';
  if (error === 'unavailable') return 'The portal can’t reach accounts right now. Try again shortly.';
  return '';
}

function firstName(value: string): string {
  if (value.includes('@')) return value.split('@')[0];
  return value.split(' ')[0];
}

function accountPlan(user: User): DemoPlan {
  const monthlySavings = PLAN_PRICE_3 - PLAN_PRICE_12;
  return {
    id: user.id,
    eaName: 'Pending match',
    term: user.plan,
    rate: formatDollars(planMonthly(user.plan)),
    rate12: formatDollars(PLAN_PRICE_12),
    monthlySavings: formatDollars(monthlySavings),
    annualSavings: formatDollars(monthlySavings * 12),
    serviceStart: 'At kickoff',
    commitmentEnd: 'Set at kickoff',
  };
}

async function cardOnFile(user: User): Promise<{ brand: string; last4: string }> {
  const fallback = {
    brand: user.cardBrand || 'Card',
    last4: user.cardLast4 || '••••',
  };
  if (!process.env.STRIPE_SECRET_KEY || !user.defaultPaymentMethodId) return fallback;
  try {
    const live = await retrieveCard(user.defaultPaymentMethodId);
    if (live.last4) return live;
  } catch {
    // Stripe redacts keys in error text, but the message can still be noisy. Keep the stored snapshot.
    console.error('payment method retrieve failed');
  }
  return fallback;
}

export default async function Page({
  searchParams,
}: {
  searchParams: { name?: string; company?: string; email?: string; error?: string };
}) {
  let session = null;
  try {
    session = await getSession();
  } catch (err) {
    console.error('session', err instanceof Error ? err.message : 'error');
    return (
      <Shell signedIn={false}>
        <div className="login">
          <section className="card">
            <h1 className="display">Client account</h1>
            <p className="page-sub">The portal is missing AUTH_SECRET. Set it and reload.</p>
          </section>
        </div>
      </Shell>
    );
  }

  const previewEnabled = process.env.PREVIEW_MODE === '1';
  const previewQuery = Boolean(searchParams?.email || searchParams?.name || searchParams?.company);
  if (!session && previewEnabled && previewQuery) {
    const email = searchParams.email || 'client@example.com';
    const name = searchParams.name || '';
    const company = searchParams.company || '';
    const displayName = name || company || email;
    return (
      <AccountView
        preview
        email={email}
        displayName={displayName}
        company={company}
        plans={DEMO.plans}
        billing={{
          contactName: name || DEMO.billing.contactName,
          company: company || DEMO.billing.company,
          email: email || DEMO.billing.email,
          address: DEMO.billing.address,
          cardBrand: DEMO.billing.cardBrand,
          cardLast4: DEMO.billing.cardLast4,
        }}
      />
    );
  }

  if (!session) {
    const signupHref = `${(process.env.MARKETING_URL || 'https://tryteleforce.com').replace(/\/$/, '')}/ea/signup`;
    const err = loginMessage(searchParams?.error);
    return (
      <Shell signedIn={false}>
        <div className="login">
          <section className="card">
            <h1 className="display">Client account</h1>
            <p className="page-sub" style={{ marginBottom: 18 }}>
              Sign in with the email and password from EA signup.
            </p>
            <form action="/api/auth/login" method="post">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required />
              </div>
              <button className="btn btn-primary btn-full" type="submit">
                Sign in
              </button>
              {err && (
                <div className="note err" role="alert">
                  {err}
                </div>
              )}
              <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
                New client? <a href={signupHref}>Complete signup</a> after your discovery call.
              </p>
            </form>
          </section>
        </div>
      </Shell>
    );
  }

  try {
    const user = await getUserById(session.userId);
    if (!user) {
      return (
        <Shell signedIn={false}>
          <div className="login">
            <section className="card">
              <h1 className="display">Client account</h1>
              <p className="page-sub">That session doesn’t match an account. Sign in again.</p>
            </section>
          </div>
        </Shell>
      );
    }
    const hasCard = hasCardOnFile(user);
    const card = hasCard ? await cardOnFile(user) : { brand: '', last4: '' };
    return (
      <AccountView
        email={user.email}
        displayName={user.fullName || user.email}
        company={user.company}
        plans={[accountPlan(user)]}
        hasCard={hasCard}
        billing={{
          contactName: user.billingContact,
          company: user.company,
          email: user.billingEmail,
          address: user.billingAddress,
          cardBrand: card.brand,
          cardLast4: card.last4,
        }}
        persistBilling
      />
    );
  } catch (err) {
    console.error('account', err instanceof Error ? err.message : 'error');
    return (
      <Shell signedIn={true}>
        <h1 className="page-title display">Account unavailable</h1>
        <p className="page-sub">We couldn’t load this account. Try again in a moment.</p>
      </Shell>
    );
  }
}

function AccountView({
  preview = false,
  email,
  displayName,
  company,
  plans,
  billing,
  hasCard = true,
  persistBilling = false,
}: {
  preview?: boolean;
  email: string;
  displayName: string;
  company?: string;
  plans: DemoPlan[];
  billing: {
    contactName: string;
    company: string;
    email: string;
    address: string;
    cardBrand: string;
    cardLast4: string;
  };
  hasCard?: boolean;
  persistBilling?: boolean;
}) {
  const threeMonth = plans.filter((plan) => plan.term === '3');
  const commitmentEndPreview = formatDate(addMonthsISO(12));

  return (
    <Shell signedIn={!preview} company={company} preview={preview}>
      {preview && <p className="page-sub">Sales preview with sample data. This is not a signed-in account.</p>}
      <h1 className="page-title display">Welcome back, {firstName(displayName)}.</h1>
      <p className="page-sub">{preview ? `Previewing ${email}` : `Signed in as ${email}`}</p>

      {!preview && !hasCard && (
        <div className="pay-banner" role="status">
          <p>
            <strong>Add a payment method before kickoff.</strong> Nothing is charged now.
            We’ll follow up so you can add a card.
          </p>
          <a className="btn btn-primary" href="#billing">
            Add payment method
          </a>
        </div>
      )}

      <section className="card">
        <h2>Your plan</h2>
        {!preview && (
          <p className="hint">
            {hasCard
              ? 'Your card is on file. Nothing is charged until your EA starts.'
              : 'No card on file yet. Nothing is charged until your EA starts.'}
          </p>
        )}
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </section>

      <section className="card">
        <h2>Increase your plan</h2>
        <p className="hint">Move to the better rate, or add a support seat.</p>
        {threeMonth.length === 0 ? (
          <p className="muted" style={{ fontSize: 14 }}>You&apos;re already on the 12-month rate — the best price.</p>
        ) : preview ? (
          <SwitchTo12
            rate12={threeMonth[0].rate12}
            monthlySavings={threeMonth[0].monthlySavings}
            annualSavings={threeMonth[0].annualSavings}
            commitmentEndPreview={commitmentEndPreview}
          />
        ) : (
          <p style={{ fontSize: 14, margin: '0 0 12px' }}>
            The 12-month rate is {threeMonth[0].rate12}/month (save {threeMonth[0].monthlySavings}/month).
            Switching is confirmed with your partnership manager — it is not applied from this page.
          </p>
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

      <section className="card">
        <h2>Add another EA</h2>
        <p className="hint">
          Request a second executive assistant. This is an additional order under your existing
          agreement — no charge until the new EA starts.
        </p>
        <AddEaForm />
      </section>

      <section className="card" id="billing">
        <h2>Billing information</h2>
        <BillingInfo init={billing} persist={persistBilling} hasCard={hasCard} />
      </section>
    </Shell>
  );
}
