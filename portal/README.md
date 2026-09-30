# Teleforce client portal

Next.js (App Router) account portal for Executive Assistant clients. Deploy to
**Vercel** with root directory `portal`, at `portal.tryteleforce.com`.

Signup stays on the marketing site (`src/pages/ea/signup.astro`, GitHub Pages).
That page calls this app to create the account. Payment information is required
on that page. Sign-in uses the same email and password. Accounts created before
a card was required still sign in.

## What signup does

Nothing is charged. There is no PaymentIntent, invoice, or subscription in this
flow. Billing at kickoff (or 3 business days after the client is matched, whichever comes first) is later work.

**Without a card** (older accounts, or a `POST /api/signup/complete` that omits
the SetupIntent): name, email, password, plan, `termsAccepted: true`, and
`signedName` (the typed legal name). `termsVersion` is optional; if it is sent
and it is not the current Terms, signup is rejected. No SetupIntent and no
Stripe call. The account stores null `stripeCustomerId`, `defaultPaymentMethodId`,
and `setupIntentId`. The portal lets that email and password sign in. Billing
information offers **Change payment method**, which opens a Stripe Card Element
so the client can put a card on file. Nothing is charged.

**With a card:**

1. The browser asks `GET /api/signup/config` for the Stripe publishable key.
2. Stripe.js mounts a Card Element. Card numbers go to Stripe, not to our server.
3. `POST /api/signup/setup-intent` creates or reuses a Stripe Customer and a
   **SetupIntent** (`usage: off_session`, `allowed_payment_method_types: ['card']`).
4. The browser confirms the card with `stripe.confirmCardSetup`.
5. `POST /api/signup/complete` checks that the SetupIntent succeeded, stores the
   PaymentMethod as the customer default, and writes the account:
   full name, work email, bcrypt password hash, plan (`3` or `12`), Terms
   acceptance time, `stripeCustomerId`, `defaultPaymentMethodId`. The same
   Terms record described below is stored either way. IP and User-Agent are
   taken from this request, not from the JSON body.

Those routes allow browser calls from `https://tryteleforce.com`,
`https://www.tryteleforce.com`, and `http://localhost:4321` (Astro’s dev server).
Add more with `SIGNUP_CORS_ORIGINS`.

The marketing site has no Content-Security-Policy today, so Stripe.js can load.
If you add one, allow `https://js.stripe.com` (script and frame),
`https://hooks.stripe.com` (frame), `https://api.stripe.com` (connect), and the
portal origin (connect). The portal loads the same Stripe.js Card Element when
a signed-in client changes the payment method.

## Terms acceptance record

The signup page is a clickwrap plus a typed electronic signature. The checkbox
names the effective date, for example “I agree to the Teleforce Terms &
Conditions effective September 25, 2026.” That date is read from the Terms
file. The legal name field can be filled from the account name, and the client
confirms or types it. Short ESIGN / UETA language sits under that field.

`GET /api/signup/terms` returns `{ termsVersion, termsContentHash }` so the
page can show the version the server will store. The hash is SHA-256 of the
Terms markdown (UTF-8). The server computes both from the file. A hash in the
JSON body is ignored. If `termsVersion` is present and does not match, the
client is told to refresh.

On success the portal writes:

- `users.terms_accepted_at` (unchanged column; still required on the account)
- a `terms_acceptances` row: `user_id`, `signed_name`, `terms_version`,
  `terms_content_hash`, `accepted_at`, `ip`, `ua`, `email_sent_at`,
  `email_error`

Accounts created before this table existed have only `terms_accepted_at`.
Login does not read `terms_acceptances`, so those accounts still sign in.
Asking them to accept a newer version later is not built.

The Terms text is `src/legal/terms.md` on the marketing site (`/terms`). The
portal ships a copy at `portal/content/terms.md` because its Vercel root is
`portal/`. When both files are readable they must be identical, or signup
refuses to run. After counsel edits the Terms, copy the file and redeploy
both apps.

After the account row is committed, the portal emails the client through
[Resend](https://resend.com): an HTML cover (name, email, plan, signed name,
version, hash, timestamp, IP) and the Terms in the body, plus the markdown
file attached. Those attachment bytes are what the hash covers. Ops is BCC’d
(`TERMS_ACCEPTANCE_BCC`, else `OPS_EMAIL`, else `legal@tryteleforce.com`).
If the send fails, or `RESEND_API_KEY` / `EMAIL_FROM` is unset, the account
stays. `email_sent_at` remains null and `email_error` stores a short reason
so the send can be retried. There is no retry button in the portal yet.

## Change a payment method

Billing information has **Change payment method**. It opens the same Stripe
Card Element used at signup (a SetupIntent, not a charge). The signed-in
dashboard does not prompt for a card. Accounts with no `defaultPaymentMethodId`
use that same action to put one on file. There is still no PaymentIntent,
invoice, subscription, or charge.

1. `GET /api/account/payment/config` returns the publishable key. The session
   cookie is required.
2. Stripe.js mounts a Card Element. Card numbers go to Stripe, not to this app.
3. `POST /api/account/payment/setup-intent` reuses or creates a Stripe Customer
   and a **SetupIntent** (`usage: off_session`, `allowed_payment_method_types: ['card']`),
   including when a card is already on file.
4. The browser confirms the card with `stripe.confirmCardSetup`.
5. `POST /api/account/payment/complete` checks that the SetupIntent succeeded
   for this account, stores the PaymentMethod as the customer default (replacing
   a previous card), and writes `stripeCustomerId`, `defaultPaymentMethodId`,
   `setupIntentId`, brand, and last4 on the user row.

### Test a card change

1. Sign in with an account from `/ea/signup`, or insert a user with null
   `stripe_customer_id`, `default_payment_method_id`, and `setup_intent_id`,
   then sign in.
2. Under Billing information, choose **Change payment method**. Use Stripe test
   card `4242 4242 4242 4242`, any future expiry, any CVC, and any ZIP. Live
   keys save a real card and still do not charge.
3. Billing shows the card on file. In Stripe, the Customer has that card as the
   default payment method and no charge. **Change payment method** again
   replaces it.

## Sign-in

`POST /api/auth/login` checks email + password against the account row and sets
an httpOnly session cookie (`jose` JWT, `AUTH_SECRET`).

The sign-in screen does not show onboarding or an assistant. After sign-in the
dashboard follows the account row:

1. Before `onboarding_completed_at` is set, a **Schedule your onboarding call**
   card embeds Calendly (`https://calendly.com/tryteleforce-sales`, the URL the
   marketing site used, via Calendly’s inline widget). Under that card the page
   reads **Your assistant: matching in progress**.
2. After ops sets `onboarding_completed_at`, the Calendly card is gone.
3. After ops sets `matched_ea_name` to the assistant’s first and last name, the
   top of the dashboard reads **Your assistant is First Last**.

Both columns are nullable and added on startup (`ALTER TABLE` only when the
column is missing). New accounts leave them null. There is no admin route.
Ops sets them in Turso with the client’s work email. The Terms email is
unchanged; the scheduling link is not sent automatically.

```bash
turso db shell <database-name>
```

```sql
-- Hide the scheduler after the onboarding call:
UPDATE users
SET onboarding_completed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE email = 'client@company.com';

-- Assign the assistant (first and last name):
UPDATE users
SET matched_ea_name = 'First Last'
WHERE email = 'client@company.com';

-- Undo either one:
UPDATE users SET onboarding_completed_at = NULL WHERE email = 'client@company.com';
UPDATE users SET matched_ea_name = NULL WHERE email = 'client@company.com';
```

Locally, with no `TURSO_DATABASE_URL`, the same statements run against
`portal/data/teleforce.db` (for example with the `sqlite3` CLI). The signup
completion screen uses the same Calendly URL.

`PREVIEW_MODE=1` keeps the sales-call link (`?company=&name=&email=`) as sample
data only. It does not create a session and does not read real accounts. Leave
it unset in production.

A signed-in **Add another EA** request is stored in `ea_requests` (focus, tasks,
bilingual need, start timing, notes, and `schedule = full-time`). `POST
/api/account/ea-request` requires the session cookie. It does not create a
Stripe PaymentIntent, invoice, subscription, or charge. Ops can bill the same
Stripe customer at kickoff. The sales preview (`PREVIEW_MODE=1`) still shows a
local success state and does not write a row.

Customer service stays as a quiet note at the bottom of the dashboard.
It is not stored. The 12-month switch on a real account is a note under the
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
charge, because a card at signup only confirms a SetupIntent. The signup page
requires payment information. A complete call that omits the SetupIntent still
does not call Stripe.

`PUBLIC_PORTAL_URL` is optional for the Astro site. Dev defaults to
`http://localhost:3000`. A production build defaults to
`https://portal.tryteleforce.com`.

## Environment

| Variable | What |
|---|---|
| `APP_URL` | This app’s base URL, no trailing slash |
| `AUTH_SECRET` | Signs the session cookie. Required in production |
| `STRIPE_SECRET_KEY` | Server key. Used only when a card is submitted: SetupIntent and Customer, no charge. Calls retry once on a network error or Stripe 5xx, and the server logs the Stripe type, code, status, and request id. Stripe 4xx messages are returned to the card form (keys redacted) |
| `STRIPE_PUBLISHABLE_KEY` | Returned when someone submits a card at signup or changes the payment method in the portal. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a fallback |
| `TURSO_DATABASE_URL` | `libsql://…` in production. Local file URL if unset outside production |
| `TURSO_AUTH_TOKEN` | Turso token. Not used for a local file |
| `PREVIEW_MODE` | `1` enables the sample-data sales link |
| `SIGNUP_CORS_ORIGINS` | Extra allowed origins, comma-separated |
| `MARKETING_URL` | Used for the signup link on the sign-in screen |
| `RESEND_API_KEY` | Sends the accepted-Terms email. If unset, the account is still created and `email_sent_at` stays null |
| `EMAIL_FROM` | From address on a domain verified in Resend, e.g. `Teleforce <legal@tryteleforce.com>` |
| `TERMS_ACCEPTANCE_BCC` | Ops BCC. If unset, `OPS_EMAIL` is used, then `legal@tryteleforce.com` |
| `OPS_EMAIL` | Fallback ops address when `TERMS_ACCEPTANCE_BCC` is unset |

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
   client changes the payment method in the portal.
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
7. In Resend, verify the sending domain and create an API key. On the portal
   project set `RESEND_API_KEY` and `EMAIL_FROM`. Set `TERMS_ACCEPTANCE_BCC`
   when the ops copy should go somewhere other than `legal@tryteleforce.com`.
   Signup still creates the account if these are missing; the Terms email
   will not go out until they are set.

Plans stay $3,000/mo (3-month) and $2,700/mo (12-month). Those figures are
display-only here, matching `src/consts.ts`.
