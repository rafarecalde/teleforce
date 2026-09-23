// Best-effort in-memory fixed-window rate limiter.
//
// NOTE: this lives in a single serverless instance's memory, so it is not shared
// across instances and resets on cold start. It is enough to blunt abuse of the
// login endpoint for a low-traffic portal. For hard guarantees, back this with a
// shared store (e.g. Upstash/Vercel KV) — see README.

type Bucket = { count: number; reset: number };
const store = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = store.get(key);
  if (!b || now > b.reset) {
    store.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= max) {
    return { ok: false, retryAfter: Math.ceil((b.reset - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** First hop in x-forwarded-for, else a stable fallback. */
export function clientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return headers.get('x-real-ip')?.trim() || '0.0.0.0';
}
