# Teleforce client portal

Next.js (App Router) account portal for Executive Assistant clients. Deploy to
**Vercel** with root directory `portal`, at `portal.tryteleforce.com`.

Signup stays on the marketing site (`src/pages/ea/signup.astro`, GitHub Pages).
That page calls this app to save a card and create the account. Sign-in uses the
same email and password.

## What signup does

Nothing is charged. There is no PaymentIntent, invoice, or subscription in this
flow. Billing at kickoff (or day 10 after match acceptance) is later work.

1. The browser asks `GET /api/signup/config` for the Stripe publishable key.
2. Stripe.js mounts a Card Element. Card numbers go to Stripe, not to our server.
3. `POST /api/signup/setup-intent` creates or reuses a Stripe Customer and a
   **SetupIntent** (`usage: off_session`, card only).
4. The browser confirms the card with `stripe.confirmCardSetup`.
5. `POST /api/signup/complete` checks that the SetupIntent succeeded, stores the
   PaymentMethod as the customer default, and writes the account:
   full name, work email, bcrypt password hash, plan (`3` or `12`), Terms
   acceptance time, `stripeCustomerId`, `defaultPaymentMethodId`.

Those routes allow browser calls from `https://tryteleforce.com`,
`https://www.tryteleforce.com`, and `http://localhost:4321` (Astro’s dev server).
Add more with `SIGNUP_CORS_ORIGINS`.

The marketing site has no Content-Security-Policy today, so Stripe.js can load.
If you add one, allow `https://js.stripe.com` (script and frame),
`https://hooks.stripe.com` (frame), `https://api.stripe.com` (connect), and the
portal origin (connect).

## Sign-in

`POST /api/auth/login` checks email + password against the account row and sets
an httpOnly session cookie (`jose` JWT, `AUTH_SECRET`).

`PREVIEW_MODE=1` keeps the sales-call link (`?company=&name=&email=`) as sample
data only. It does not create a session and does not read real accounts. Leave
it unset in production.

Seat-request and “add another EA” buttons are still local success states. The
12-month switch on a real account is a note, not a fake contract change.

## Run locally

```bash
cd portal
cp .env.example .env.local
# fill AUTH_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
npm install
npm run dev            # http://localhost:3000
```

In another terminal, from the repo root:

```bash
npm run dev            # http://localhost:4321/ea/signup
```

Omit `TURSO_DATABASE_URL` locally. Accounts are stored in
`portal/data/teleforce.db` (gitignored). That file is not durable on Vercel.

Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
Use **test** keys until go-live. Live keys save a real card and still do not
charge, because signup only confirms a SetupIntent.

`PUBLIC_PORTAL_URL` is optional for the Astro site. Dev defaults to
`http://localhost:3000`. A production build defaults to
`https://portal.tryteleforce.com`.

## Environment

| Variable | What |
|---|---|
| `APP_URL` | This app’s base URL, no trailing slash |
| `AUTH_SECRET` | Signs the session cookie. Required in production |
| `STRIPE_SECRET_KEY` | Server key. SetupIntent and Customer only |
| `STRIPE_PUBLISHABLE_KEY` | Returned to the signup page. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a fallback |
| `TURSO_DATABASE_URL` | `libsql://…` in production. Local file URL if unset outside production |
| `TURSO_AUTH_TOKEN` | Turso token. Not used for a local file |
| `PREVIEW_MODE` | `1` enables the sample-data sales link |
| `SIGNUP_CORS_ORIGINS` | Extra allowed origins, comma-separated |
| `MARKETING_URL` | Used for the signup link on the sign-in screen |

The Astro site reads `PUBLIC_PORTAL_URL` (see the repo root `.env.example`).

## Deploy the portal (Vercel)

This repo does not deploy the portal for you.

1. Create a Turso database and token (`turso db create`, `turso db show --url`,
   `turso db tokens create`). Put the URL and token in `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN`.
2. Vercel → New Project → this repo → **Root Directory = `portal`**.
3. Set `APP_URL=https://portal.tryteleforce.com`, `AUTH_SECRET`, the Stripe
   keys, and the Turso variables. Leave `PREVIEW_MODE` empty.
4. Add the domain `portal.tryteleforce.com` and the CNAME Vercel shows. The apex
   stays on GitHub Pages.
5. Stripe → Developers → API keys. Put the secret and publishable keys on
   Vercel only. Do not commit them. Webhooks are not required for SetupIntent
   confirmation; the browser confirm plus `setupIntents.retrieve` is the check.
6. Redeploy the marketing site only if the portal host is not
   `https://portal.tryteleforce.com`. In that case set `PUBLIC_PORTAL_URL` for
   the Astro build.

Plans stay $3,000/mo (3-month) and $2,700/mo (12-month). Those figures are
display-only here, matching `src/consts.ts`.
