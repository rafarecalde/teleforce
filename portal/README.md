# Teleforce client portal — preview

A client-facing **preview** of the Teleforce account portal — the experience a
client gets to manage their Executive Assistant plan and billing. Built to demo
on sales calls (personalize it with a prospect's name/company) and to screenshot
for the marketing site.

- **Framework:** Next.js (App Router), deploys to **Vercel** at
  `portal.tryteleforce.com`.
- **Demo data, no billing.** No Stripe, no charges, and **no card is ever
  collected or stored** — the card is shown as "on file" only. Wire it to real
  billing when you have a live client (see below).
- Runs with **zero config**.

## One page, four sections
1. **Your plan** — term, monthly rate, EA name, service start, commitment end.
2. **Increase your plan** — "Switch to 12-month" (with the acknowledgment
   checkbox) + no-charge "add a customer service / SDR seat" requests.
3. **Add another EA** — request form + acknowledgment.
4. **Billing information** — editable billing contact / email / address, and the
   card shown as **on file** (secure card collection is handled by a processor at
   kickoff, never typed here).

All actions show a realistic success state; nothing is persisted.

## Run it

```bash
cd portal
npm install
npm run dev            # http://localhost:3000
```

Sign in with any email (name + company optional) to see the account.

## Personalize it for a sales call

Open a link with query params — the portal renders as that prospect's account, no
sign-in needed:

```
https://portal.tryteleforce.com/?company=Acme%20Corp&name=Jane%20Doe
```

Or sign in with their name/company on the form.

## Optional config (`.env.local`)

| Var | What |
|---|---|
| `APP_URL` | This app's base URL, no trailing slash |
| `AUTH_SECRET` | Signs the session cookie (a demo default is used if unset) |
| `PORTAL_PASSCODE` | If set, visitors must enter it on the sign-in screen |

## Deploy (Vercel)

1. Vercel → New Project → import this repo → **Root Directory = `portal`**.
2. (Optional) set `APP_URL`, `AUTH_SECRET`, `PORTAL_PASSCODE`.
3. Add the domain `portal.tryteleforce.com` and the CNAME Vercel shows to your DNS
   (the apex stays on GitHub Pages).

## Making it real later

When you have a live client, wire the four sections to your billing source of
truth (e.g. Stripe): replace `lib/demo.ts` with real reads, add passwordless
magic-link auth + a Stripe customer lookup, and use Stripe's hosted card
collection (SetupIntent / Billing Portal) so card data never touches this app.
The section components stay the same.
