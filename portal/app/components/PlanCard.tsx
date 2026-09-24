import type { DemoPlan } from '@/lib/demo';

export default function PlanCard({ plan }: { plan: DemoPlan }) {
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
