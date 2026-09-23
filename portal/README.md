# Teleforce client portal

A minimal client account portal for Teleforce clients — one page (`/`) with four
sections: **Your plan**, **Increase your plan**, **Add another EA**, and
**Billing information**.

- **Framework:** Next.js (App Router), deployed to **Vercel** at
  `portal.tryteleforce.com`.
- **No database.** Stripe is the source of truth; subscription metadata holds the
  plan details.
- **Auth:** passwordless magic link (JWT via `jose`, 15-min expiry) emailed by
  Resend, exchanged for an httpOnly, `SameSite=Lax`, 7-day session cookie.
- The marketing site (Astro on GitHub Pages) is untouched except for a "Client
  login" link.

---

## 1. Local setup

```bash
cd portal
npm install
cp .env.example .env.local   # then fill it in (see below)
```

### Environment variables (`.env.local`)

| Var | What |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe **test** secret key (`sk_test_…`) while developing |
| `STRIPE_PRICE_3MO` | Price ID for the 3-month EA plan |
| `STRIPE_PRICE_12MO` | Price ID for the 12-month EA plan |
| `RESEND_API_KEY` | Resend API key (email). If unset, sign-in links print to the server console |
| `AUTH_SECRET` | 32+ random chars — signs the JWTs. `openssl rand -base64 48` |
| `OPS_EMAIL` | Where order/ops notifications go |
| `APP_URL` | This app's base URL, no trailing slash (`http://localhost:3000` locally) |
| `MAIL_FROM` | *(optional)* verified Resend sender; `onboarding@resend.dev` works for testing |
| `STRIPE_PORTAL_CONFIGURATION_ID` | *(optional but recommended)* from `npm run setup:portal` |

---

## 2. Stripe setup (test mode)

1. In the Stripe dashboard (test mode), create a **Product** "Executive
   Assistant" with two recurring monthly **Prices** — one for the 3-month plan,
   one for the 12-month plan. Copy their IDs into `STRIPE_PRICE_3MO` /
   `STRIPE_PRICE_12MO`. **Amounts are read from these Price objects — never
   hardcoded.**
2. Create the restricted **Billing Portal configuration**:
   ```bash
   npm run setup:portal
   ```
   Copy the printed `bpc_…` id into `STRIPE_PORTAL_CONFIGURATION_ID`. It allows
   payment-method updates + invoice history + billing email/address, and
   **disables cancellation and plan switching**.
3. Seed a test customer with an active 3-month subscription:
   ```bash
   npm run seed                     # uses test.client@example.com
   npm run seed you@example.com     # or your own email
   ```
   This creates the customer, attaches a test card, and writes the subscription
   metadata (`term`, `ea_name`, `service_start`, `commitment_end`).

### Subscription metadata (the portal reads these)

| Key | Example |
|---|---|
| `term` | `"3"` or `"12"` |
| `ea_name` | `María González` |
| `service_start` | ISO date of kickoff |
| `commitment_end` | ISO date the initial term ends |

The "switch to 12-month" flow also writes `amend_ack_at`, `amend_ack_ip`,
`amend_ack_version`, `amend_ack_email`.

---

## 3. Run it

```bash
npm run dev            # http://localhost:3000
```

Enter the seeded email → the magic link is emailed (or printed to the console if
`RESEND_API_KEY` is unset) → click it → you're in.

**Test cards:** the seed uses Stripe's `pm_card_visa`. In the Billing Portal, use
`4242 4242 4242 4242` to update the card.

---

## 4. Deploy to Vercel (preview — do not point production DNS yet)

1. Push the `portal` branch and open the PR (already done if you're reading this
   in a PR).
2. In Vercel, **New Project** → import this repo → set **Root Directory** to
   `portal`. Framework preset: Next.js.
3. Add all env vars from the table above (still **test** keys for now). Set
   `APP_URL` to the Vercel preview URL.
4. Deploy. Vercel gives you a preview URL — test the full flow there.

### Going to the `portal.tryteleforce.com` subdomain

1. In Vercel → Project → **Domains**, add `portal.tryteleforce.com`.
2. In your DNS (Namecheap), add the **CNAME** Vercel shows (host `portal` →
   `cname.vercel-dns.com`). The apex `tryteleforce.com` stays on GitHub Pages —
   only the `portal` subdomain points to Vercel.
3. Set `APP_URL=https://portal.tryteleforce.com` and redeploy.

---

## 5. Going live (production Stripe)

1. Recreate the two Prices and the Billing Portal configuration in **live** mode;
   update `STRIPE_PRICE_3MO`, `STRIPE_PRICE_12MO`,
   `STRIPE_PORTAL_CONFIGURATION_ID`.
2. Swap `STRIPE_SECRET_KEY` to the live key (`sk_live_…`).
3. Verify your sending domain in Resend and set `MAIL_FROM` to an address on it.
4. Confirm `APP_URL=https://portal.tryteleforce.com`.
5. Real subscriptions are created by ops at kickoff (the portal never creates a
   charge for new EAs).

---

## Notes / limitations

- **Rate limiting** (login) is in-memory per serverless instance — enough to
  blunt abuse for a low-traffic portal. For hard guarantees, back
  `lib/ratelimit.ts` with Upstash/Vercel KV.
- **Magic links** are single-use *intent* (short 15-min expiry). Hard one-time
  invalidation (a used-token blocklist) also needs a shared store; not included.
- Every server call re-derives the Stripe customer from the signed session — a
  customer ID from the client is never trusted.
- No Stripe **webhooks** are required for this portal. If you later want the UI to
  reflect out-of-band changes instantly, add one.
