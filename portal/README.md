# Teleforce client portal

Next.js (App Router) account portal for Executive Assistant clients. Deploy to
**Vercel** with root directory `portal`, at `portal.tryteleforce.com`.

Signup stays on the marketing site (`src/pages/ea/signup.astro`, GitHub Pages).
That page calls this app to create the account. A card is optional. Sign-in uses
the same email and password either way.

## What signup does

Nothing is charged. There is no PaymentIntent, invoice, or subscription in this
flow. Billing at kickoff (or day 10 after match acceptance) is later work.

**Without a card** (the default on the signup page): `POST /api/signup/complete`
with name, email, password, plan, and `termsAccepted: true`. No SetupIntent and
no Stripe call. The account stores null `stripeCustomerId`,
`defaultPaymentMethodId`, and `setupIntentId`. The portal lets that email and
password sign in. A banner and the billing section open a Stripe Card Element
so the client can add a card later. Nothing is charged.

**With a card** (unchanged):

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
portal origin (connect). The portal loads the same Stripe.js Card Element for
signed-in clients who still need a card.

## Add a card after signup

Signed-in accounts with no `defaultPaymentMethodId` see an “Add payment method”
banner. It scrolls to a Card Element under Billing information. There is still
no PaymentIntent, invoice, subscription, or charge.

1. `GET /api/account/payment/config` returns the publishable key. The session
   cookie is required.
2. Stripe.js mounts a Card Element. Card numbers go to Stripe, not to this app.
3. `POST /api/account/payment/setup-intent` reuses or creates a Stripe Customer
   and a **SetupIntent** (`usage: off_session`, card only).
4. The browser confirms the card with `stripe.confirmCardSetup`.
5. `POST /api/account/payment/complete` checks that the SetupIntent succeeded
   for this account, stores the PaymentMethod as the customer default, and
   writes `stripeCustomerId`, `defaultPaymentMethodId`, `setupIntentId`, brand,
   and last4 on the user row.

Signup’s “Add a card later” and “Add a card now” choices are unchanged.

### Test with a logged-in cardless account

1. From the repo root, run the marketing site and the portal (`npm run dev` in
   each). On `/ea/signup`, choose **Add a card later**, create the account, then
   sign in at the portal with that email and password.
2. Or insert a user with null `stripe_customer_id`, `default_payment_method_id`,
   and `setup_intent_id`, then sign in.
3. **Add payment method** on the banner opens the secure card field. Use Stripe
   test card `4242 4242 4242 4242`, any future expiry, any CVC, and any ZIP.
   Live keys save a real card and still do not charge.
4. The banner goes away and Billing shows the card on file. In Stripe, the
   Customer has a default payment method and no charge.

## Sign-in

`POST /api/auth/login` checks email + password against the account row and sets
an httpOnly session cookie (`jose` JWT, `AUTH_SECRET`).

`PREVIEW_MODE=1` keeps the sales-call link (`?company=&name=&email=`) as sample
data only. It does not create a session and does not read real accounts. Leave
it unset in production.

A signed-in **Add another EA** request is stored in `ea_requests` (focus, tasks,
bilingual need, start timing, notes, and `schedule = full-time`). `POST
/api/account/ea-request` requires the session cookie. It does not create a
Stripe PaymentIntent, invoice, subscription, or charge. Ops can bill the same
Stripe customer at kickoff. The sales preview (`PREVIEW_MODE=1`) still shows a
local success state and does not write a row.

Customer service and SDR stay as quiet notes at the bottom of the dashboard.
They are not stored. The 12-month switch on a real account is a note under the
plan, not a contract change.

## Run locally

```bash
cd portal
cp .env.example .env.local
# fill AUTH_SECRET. Stripe keys are required only when a card is submitted.
npm install
npm run dev            # http://localhost:3000
```

In another terminal, from the repo root:

```bash
npm run dev            # http://localhost:4321/ea/signup
```

Omit `TURSO_DATABASE_URL` locally. Accounts are stored in
`portal/data/teleforce.db` (gitignored). That file is not durable on Vercel.

Stripe test card, if you add one: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.
Use **test** keys until go-live. Live keys save a real card and still do not
charge, because a card at signup only confirms a SetupIntent. Signup without a
card does not call Stripe.

`PUBLIC_PORTAL_URL` is optional for the Astro site. Dev defaults to
`http://localhost:3000`. A production build defaults to
`https://portal.tryteleforce.com`.

## Environment

| Variable | What |
|---|---|
| `APP_URL` | This app’s base URL, no trailing slash |
| `AUTH_SECRET` | Signs the session cookie. Required in production |
| `STRIPE_SECRET_KEY` | Server key. Used only when a card is submitted: SetupIntent and Customer, no charge. Calls retry once on a network error or Stripe 5xx, and the server logs the Stripe type, code, status, and request id |
| `STRIPE_PUBLISHABLE_KEY` | Returned when someone adds a card at signup or in the portal. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a fallback |
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
   keys, and the Turso variables. Leave `PREVIEW_MODE` empty. Stripe keys can
   stay set; they are used when a signup includes a card, or when a signed-in
   client adds a card in the portal.
   Databases created when a card was required are rebuilt once on startup so
   `stripe_customer_id`, `default_payment_method_id`, and `setup_intent_id`
   can be null. Existing card-on-file rows are kept.
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
