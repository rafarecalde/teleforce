// All money comes straight from Stripe Price objects (amount in the smallest
// currency unit). We never hardcode dollar figures.

export function formatMoney(
  amountMinor: number | null | undefined,
  currency: string = 'usd',
): string {
  if (amountMinor == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100);
}

/** Accepts a Unix seconds timestamp (Stripe) or an ISO date string (metadata). */
export function formatDate(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—';
  const d = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** today + n months, as an ISO string (UTC date). */
export function addMonthsISO(months: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}
