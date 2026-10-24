# Teleforce client portal

Next.js (App Router) account portal for Executive Assistant clients. Deploy to
**Vercel** with root directory `portal`, at `portal.tryteleforce.com`.

Signup stays on the marketing site (`src/pages/ea/signup.astro`, GitHub Pages).
That page calls this app to create the account. A saved card is required.
Sign-in uses the same email and password.

## What signup does

Nothing is charged at signup. A saved card is required. There is no PaymentIntent
or subscription in the signup flow. No charge while we search and match. A click
or portal acceptance bills on the earlier of kickoff and three business days after
acceptance. If the client neither accepts nor declines within three business days,
acceptance is recorded automatically and billing starts that day. This app does not
charge the card unless `STRIPE_AUTO_BILLING` is exactly `true`.

A card is required. `POST /api/signup/complete` without a succeeded SetupIntent
is rejected. `termsVersion` is optional; if it is sent and it is not the current
Terms, signup is rejected.

**Card on file:**

1. The browser asks `GET /api/signup/config` for the Stripe publishable key.
2. Stripe.js mounts a Card Element. Card numbers go to Stripe, not to our server.
3. `POST /api/signup/setup-intent` creates or reuses a Stripe Customer and a
   **SetupIntent** (`usage: off_session`, `allowed_payment_method_types: ['card']`).
4. The browser confirms the card with `stripe.confirmCardSetup`.
5. `POST /api/signup/complete` checks that the SetupIntent succeeded, stores the
   PaymentMethod as the customer default, and writes the account:
   full name, work email, bcrypt password hash, plan (`3` or `12`), Terms
   acceptance time, `stripeCustomerId`, `defaultPaymentMethodId`, and the card
   brand and last4. The Terms record described below is stored with the account.
   IP and User-Agent are
   taken from this request, not from the JSON body.

Those routes allow browser calls from `https://tryteleforce.com`,
`https://www.tryteleforce.com`, and `http://localhost:4321` (Astro’s dev server).
Add more with `SIGNUP_CORS_ORIGINS`.

The marketing site has no Content-Security-Policy today, so Stripe.js can load.
If you add one, allow `https://js.stripe.com` (script and frame),
`https://hooks.stripe.com` (frame), `https://api.stripe.com` (connect), and the
portal origin (connect). The portal loads the same Stripe.js Card Element for
signed-in clients who still need a card.

## Terms acceptance record

The signup page is a clickwrap plus a typed electronic signature. The checkbox
names the effective date, for example “I agree to the Teleforce Terms &
Conditions effective October 23, 2026.” That date is read from the Terms
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
[Resend](https://resend.com). The note is short. It attaches a PDF of the
accepted Terms, rendered on the server from `content/terms.md` (headings,
bold clause numbers, italics, and lists when the file has them). Each page
has the Teleforce name at the top and a page number. The first page includes
an acceptance record: the typed full name, email, plan, acceptance time in
America/Guayaquil and in UTC, the Terms version (the effective date), and
the SHA-256 stored with the account. That hash is of the Terms markdown, not
of the PDF file. The filename is
`Teleforce-Terms-<effective-date>-<Last-name>.pdf`.

If the PDF cannot be built, or Resend rejects the message that carries it,
the portal logs the error and sends the same note without an attachment,
with a link to https://tryteleforce.com/terms/. There is no markdown or
plain-text file attached. Ops is BCC’d (`TERMS_ACCEPTANCE_BCC`, else
`OPS_EMAIL`, else `legal@tryteleforce.com`). If that send also fails, or
`RESEND_API_KEY` / `EMAIL_FROM` is unset, the account stays.
`email_sent_at` remains null and `email_error` stores a short reason so the
send can be retried. There is no retry button in the portal yet. The IP
address and user agent stay on the `terms_acceptances` row.

The same moment sends an internal new-signup notice from `EMAIL_FROM`.
`SIGNUP_ALERT_TO` is a comma-separated list. When it is unset, the message
goes to `rafael@recaldelaw.com`. The body is the client name, email, plan
(3-month or 12-month), card brand and last4 when a card was saved, the signup
time in America/Guayaquil, and
`https://dashboard.stripe.com/customers/<stripe_customer_id>` when a Stripe
customer exists. A send failure is logged and does not change the signup
response. The message has no password, API key, or full card number.

It also sends the client a separate welcome email from `EMAIL_FROM`, so the
onboarding note is not buried under the Terms copy. The message thanks them,
asks them to book a short onboarding call, and links
`ONBOARDING_CALENDLY_URL` (default `https://calendly.com/tryteleforce-sales`,
the same scheduler on the signed-in home page). It points them at
`https://portal.tryteleforce.com` and uses the same billing line as the
dashboard: nothing is charged at signup, and billing starts at kickoff or 3
business days after they accept, whichever comes first, or the day the match
is accepted automatically. A send failure is logged and does not change the
signup response. The three messages are sent together, so the welcome email
does not add a second wait after the Terms email.

## Add a card after signup

New signups already have a card. An older account with no `defaultPaymentMethodId`
still sees an “Add your card” banner. It scrolls to a Card Element under Billing
information. There is still no PaymentIntent, invoice, subscription, or charge.

1. `GET /api/account/payment/config` returns the publishable key. The session
   cookie is required.
2. Stripe.js mounts a Card Element. Card numbers go to Stripe, not to this app.
3. `POST /api/account/payment/setup-intent` reuses or creates a Stripe Customer
   and a **SetupIntent** (`usage: off_session`, `allowed_payment_method_types: ['card']`).
4. The browser confirms the card with `stripe.confirmCardSetup`.
5. `POST /api/account/payment/complete` checks that the SetupIntent succeeded
   for this account, stores the PaymentMethod as the customer default, and
   writes `stripeCustomerId`, `defaultPaymentMethodId`, `setupIntentId`, brand,
   and last4 on the user row.

Signup no longer offers “Add a card later.”

### Test with a logged-in account that has no card

1. From the repo root, run the marketing site and the portal (`npm run dev` in
   each). `/ea/signup` will not create an account without a saved card.
2. Insert a user with null `stripe_customer_id`, `default_payment_method_id`,
   and `setup_intent_id`, then sign in.
3. **Add payment method** on the banner opens the secure card field. Use Stripe
   test card `4242 4242 4242 4242`, any future expiry, any CVC, and any ZIP.
   Live keys save a real card and still do not charge.
4. The banner goes away and Billing shows the card on file. In Stripe, the
   Customer has a default payment method and no charge.

## Sign-in

`POST /api/auth/login` checks email + password against the account row and sets
an httpOnly session cookie (`jose` JWT, `AUTH_SECRET`).

The sign-in screen does not show onboarding or an assistant. After sign-in the
dashboard follows the account row:

1. Before `onboarding_completed_at` is set, a **Schedule your onboarding call**
   card embeds Calendly (`https://calendly.com/tryteleforce-sales`, the URL the
   marketing site used, via Calendly’s inline widget). About 30 minutes. The
   page does not say matching is in progress. Onboarding comes first.
2. After ops sets `onboarding_completed_at`, the Calendly card is gone. If there
   is no live match package and no assistant name, the page reads **Your
   assistant: matching in progress**.
3. When a match package is published, the client sees **Meet your EA**: photo
   URL, intro video (YouTube, Loom, and Vimeo embed; any other https link stays
   a link), background, and the Partnership Manager. The card shows a reply
   deadline three business days (Monday–Friday, America/New_York) after publish.
   **Accept & book your kickoff** records the acceptance time, IP, and user agent
   with method `portal`. The first introduction also has **Request a different
   match**, which records that one decline. A second introduction does not.
   Billing on that card is one short line plus a link to `https://tryteleforce.com/terms/`.
4. After a click, email, or automatic acceptance, the client gets a branded
   **You're all set** email with a **Book your kickoff** button
   (`KICKOFF_CALENDLY_URL`, or the onboarding scheduler when that is unset —
   default `https://calendly.com/tryteleforce-sales`).
   The portal shows the same **Book your kickoff** card until kickoff is marked
   booked or done. The client can mark it booked, and admin can mark it booked
   or done. If it is still unbooked one business day (Monday–Friday,
   America/New_York) after acceptance, the hourly cron sends one branded
   reminder with the same button. Marking kickoff booked does not start billing.
   **Request a rematch** shows only after kickoff, and only while the client has
   fewer than two client-requested rematches in the rolling 12 months. **Mark
   departure** records an EA departure and does not use a rematch. A replacement
   is due 10 business days after either event. Admin shows that date. Publishing
   the next assistant records it as presented.
5. `matched_ea_name` is set from the package on publish. **Your assistant is
   First Last** shows after acceptance, and it still shows for an account that
   only has the SQL name and no package. It stays hidden while a published
   package is waiting for a yes.

Both columns are nullable and added on startup (`ALTER TABLE` only when the
column is missing). `match_packages` is created the same way. New accounts
leave the match empty. Photos are URLs. There is no file upload. Setting
onboarding or the assistant name in Turso does not send another email.

`/admin` lists clients and edits the package. It requires a signed-in portal
account whose email is in `ADMIN_EMAILS` (default `rafael@recaldelaw.com`).
Publish emails a branded **Meet your EA** message: photo, intro link, background,
Partnership Manager, the reply deadline, an **Accept EA** link, and (on the first
introduction) **Request a different match**. The accept link is a signed token.
Opening it records acceptance (time, IP, user agent, method `email`) and lands
on the kickoff scheduler. A reminder with the same buttons goes out 24 hours
before the deadline. If the client has neither accepted nor declined by then,
`/api/cron/match` (`Authorization: Bearer $CRON_SECRET`, GET or POST) records method
`auto`, emails **You're all set, book your kickoff**, and alerts sales. The same
job sends one **Your kickoff is waiting** reminder when kickoff is still
unbooked one business day after acceptance. GitHub Actions calls it hourly.
Vercel Cron is a once-a-day backstop, because a Hobby project cannot schedule
a cron more often than daily.

A click or portal acceptance bills on the earlier of kickoff and three business
days after acceptance. An automatic acceptance bills on that acceptance time.
`STRIPE_AUTO_BILLING` is off unless it is exactly `true`. While it is off, the
sales alert says **Charge now in Stripe** and links the customer. While it is
on, the cron creates a subscription on the saved card (`STRIPE_PRICE_3` or
`STRIPE_PRICE_12`) anchored to that billing start. A failed send is logged and
does not change the response. Signup alerts keep their own default
(`SIGNUP_ALERT_TO` unset still means `sales@tryteleforce.com` for match alerts only).

The same fields can still be set in Turso. Publishing is what copies the
assistant name onto `matched_ea_name`.

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
charge, because a card at signup only confirms a SetupIntent. Signup without a
card does not call Stripe.

`PUBLIC_PORTAL_URL` is optional for the Astro site. Dev defaults to
`http://localhost:3000`. A production build defaults to
`https://portal.tryteleforce.com`.

## Tasks

Once a client is matched (and, if a live introduction exists, only after they accept), the portal shows a Tasks card. The client adds tasks with a title, notes, due date, priority, and an optional link. Statuses are To do, In progress, Waiting on you, and Done. Each task has a comment thread. An admin allowlisted in `ADMIN_EMAILS` can also update status and comments on the client’s admin page.

The default order is overdue first, then priority, then due date. Dragging a task, or Move up / Move down, saves that order. Suggested order puts the list back on the default.

On the kickoff card and on `/kickoff`, assigning a first task is optional and sits under Book your kickoff. The “You’re all set” email links to `/#tasks`. There is no email digest.

Assistants have their own login, separate from client accounts, and each assistant is dedicated to one client. Admin creates one at `/admin/eas` with the assistant’s name and email. That sends a set-password link (the same Resend key as other portal mail; the link is also shown in admin if mail does not send). If exactly one client already uses that assistant name, they are linked. If several do, admin picks one. Linking a different client replaces the previous one, and admin confirms that replacement. An assistant who signs in at `/` lands on `/ea`, which is that client’s task page. The header shows the client’s name. With no client linked, the page says they’ll see their client once matched. They can update task status, mark a task done, and comment. They do not see billing, other clients, or account settings. The private EA calendar feed is on that page.

Calendar sync is a private ICS feed per account, one token for the client and one for the EA. Add to Google Calendar opens `https://calendar.google.com/calendar/r?cid=` with a `webcal://` feed of tasks that have a due date. Google’s servers fetch that URL, so `APP_URL` must be the public portal origin. No new credentials. Google OAuth push is not built. A later version would need a Google Cloud OAuth client with the Calendar API enabled, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and a redirect URI on this portal, and the controls would stay hidden until those are set.

## Environment

| Variable | What |
|---|---|
| `APP_URL` | This app’s base URL, no trailing slash |
| `AUTH_SECRET` | Signs the session cookie. Required in production |
| `STRIPE_SECRET_KEY` | Server key. Used only when a card is submitted: SetupIntent and Customer, no charge. Calls retry once on a network error or Stripe 5xx, and the server logs the Stripe type, code, status, and request id. Stripe 4xx messages are returned to the card form (keys redacted) |
| `STRIPE_PUBLISHABLE_KEY` | Returned when someone adds a card at signup or in the portal. `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is a fallback |
| `TURSO_DATABASE_URL` | `libsql://…` in production. Local file URL if unset outside production |
| `TURSO_AUTH_TOKEN` | Turso token. Not used for a local file |
| `PREVIEW_MODE` | `1` enables the sample-data sales link |
| `SIGNUP_CORS_ORIGINS` | Extra allowed origins, comma-separated |
| `MARKETING_URL` | Used for the signup link on the sign-in screen |
| `KICKOFF_CALENDLY_URL` | Kickoff scheduler after the client accepts. When unset or not an http(s) URL, uses the onboarding scheduler (`ONBOARDING_CALENDLY_URL`, default `https://calendly.com/tryteleforce-sales`) |
| `CRON_SECRET` | Bearer token for `GET` or `POST /api/cron/match`. Set this on the Vercel project. Set the same value as the GitHub repo secret `PORTAL_CRON_SECRET`. The route returns 401 when this is empty |
| `STRIPE_AUTO_BILLING` | `true` creates a subscription at billing start. Anything else leaves charging to the sales alert |
| `STRIPE_PRICE_3` / `STRIPE_PRICE_12` | Stripe Price ids used only when auto billing is on |
| `ADMIN_EMAILS` | Comma-separated allowlist for `/admin`. The person must also be able to sign in. Defaults to `rafael@recaldelaw.com` |
| `DEFAULT_PARTNERSHIP_MANAGER_NAME` | Prefilled Partnership Manager name on a match package |
| `DEFAULT_PARTNERSHIP_MANAGER_EMAIL` | Prefilled Partnership Manager email. Publish requires one, from the form or here |
| `RESEND_API_KEY` | Sends the accepted-Terms email. If unset, the account is still created and `email_sent_at` stays null |
| `EMAIL_FROM` | From address on a domain verified in Resend, e.g. `Teleforce <legal@tryteleforce.com>` |
| `TERMS_ACCEPTANCE_BCC` | Ops BCC. If unset, `OPS_EMAIL` is used, then `legal@tryteleforce.com` |
| `OPS_EMAIL` | Fallback ops address when `TERMS_ACCEPTANCE_BCC` is unset |
| `SIGNUP_ALERT_TO` | Internal new-signup alert, comma-separated. Defaults to `rafael@recaldelaw.com`. Uses `RESEND_API_KEY` and `EMAIL_FROM`. A send failure is logged and signup still succeeds |
| `ONBOARDING_CALENDLY_URL` | Onboarding-call link in the client welcome email and the signed-in scheduler. Defaults to `https://calendly.com/tryteleforce-sales`. A welcome-email failure is logged and signup still succeeds |

The Astro site reads `PUBLIC_PORTAL_URL` (see the repo root `.env.example`).

## Deploy the portal (Vercel)

This repo does not deploy the portal for you.

1. Create a Turso database and token (`turso db create`, `turso db show --url`,
   `turso db tokens create`). Put the URL and token in `TURSO_DATABASE_URL` and
   `TURSO_AUTH_TOKEN`.
2. Vercel → New Project → this repo → **Root Directory = `portal`**.
3. Set `APP_URL=https://portal.tryteleforce.com`, `AUTH_SECRET`, `CRON_SECRET`,
   the Stripe keys, and the Turso variables. Leave `PREVIEW_MODE` empty. Stripe
   keys can stay set; they are used when a signup includes a card, or when a
   signed-in client adds a card in the portal. `CRON_SECRET` must also be stored
   as the GitHub repository secret `PORTAL_CRON_SECRET` (same value). Vercel Cron
   and the hourly GitHub Action both send `Authorization: Bearer` with that value.
   The portal build does not read `CRON_SECRET`, `AUTH_SECRET`, or
   `TURSO_DATABASE_URL`; those are required at runtime, not during `next build`.
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
   Set `SIGNUP_ALERT_TO` when the new-signup alert should go somewhere other
   than `rafael@recaldelaw.com` (comma-separated). Set
   `ONBOARDING_CALENDLY_URL` when the onboarding scheduler is not
   `https://calendly.com/tryteleforce-sales`. Signup still creates the
   account if these are missing; the Terms email, the signup alert, and the
   welcome email will not go out until Resend is configured.

Plans stay $3,000/mo (3-month) and $2,700/mo (12-month). Those figures are
display-only here, matching `src/consts.ts`.
