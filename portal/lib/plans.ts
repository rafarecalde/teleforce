// Display-only EA rates. Keep in sync with src/consts.ts (EA.price3mo / EA.price12mo).
// Signup stores the plan code and does not charge these amounts.

export const PLAN_PRICE_3 = 3000;
export const PLAN_PRICE_12 = 2700;

export type PlanCode = '3' | '12';

export function isPlanCode(value: string): value is PlanCode {
  return value === '3' || value === '12';
}

export function formatDollars(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function planMonthly(plan: PlanCode): number {
  return plan === '12' ? PLAN_PRICE_12 : PLAN_PRICE_3;
}

export function planLabel(plan: PlanCode): string {
  return plan === '12' ? '12-month' : '3-month';
}
