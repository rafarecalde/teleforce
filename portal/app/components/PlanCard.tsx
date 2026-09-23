import { formatDate, formatMoney } from '@/lib/money';
import type Stripe from 'stripe';
import { subPrice } from '@/lib/stripe';

export type PlanView = {
  eaName: string;
  term: string; // "3" | "12" | ""
  rate: string;
  serviceStart: string;
  commitmentEnd: string;
};

export function toPlanView(sub: Stripe.Subscription): PlanView {
  const price = subPrice(sub);
  const term = sub.metadata?.term ?? '';
  return {
    eaName: sub.metadata?.ea_name || 'Your executive assistant',
    term,
    rate: formatMoney(price?.unit_amount, price?.currency ?? 'usd'),
    serviceStart: formatDate(sub.metadata?.service_start || null),
    commitmentEnd: formatDate(sub.metadata?.commitment_end || null),
  };
}

export default function PlanCard({ plan }: { plan: PlanView }) {
  const termLabel = plan.term === '12' ? '12-month' : plan.term === '3' ? '3-month' : '—';
  return (
    <div className="plan">
      <div className="plan-head">
        <span className="plan-ea">{plan.eaName}</span>
        <span className="badge">{termLabel} term</span>
      </div>
      <div className="kv">
        <span className="k">Monthly rate</span>
        <span className="v">{plan.rate}/mo</span>
        <span className="k">Service start</span>
        <span className="v">{plan.serviceStart}</span>
        <span className="k">Initial term ends</span>
        <span className="v">{plan.commitmentEnd}</span>
      </div>
    </div>
  );
}
