export type BillingView = {
  cardBrand: string | null;
  last4: string | null;
  nextChargeDate: string;
  nextChargeAmount: string;
  billingEmail: string;
};

export default function BillingInfo({ billing }: { billing: BillingView }) {
  const method =
    billing.cardBrand && billing.last4
      ? `${cap(billing.cardBrand)} ···· ${billing.last4}`
      : 'No card on file';

  return (
    <div>
      <div className="kv" style={{ marginTop: 0 }}>
        <span className="k">Payment method</span>
        <span className="v">{method}</span>
        <span className="k">Next charge</span>
        <span className="v">
          {billing.nextChargeAmount} on {billing.nextChargeDate}
        </span>
        <span className="k">Billing email</span>
        <span className="v">{billing.billingEmail}</span>
      </div>

      <hr className="divider" />

      {/* Opens Stripe's hosted Billing Portal (update card, view invoices). */}
      <form action="/api/billing/portal" method="post">
        <button className="btn btn-primary" type="submit">
          Manage billing
        </button>
      </form>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
        Update your card, billing email, or download invoices. To change or cancel a plan, contact
        your account manager.
      </p>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
