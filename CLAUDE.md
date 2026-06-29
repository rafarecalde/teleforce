# CLAUDE.md — Signal content agent

## Mission
Write SEO blog posts for Teleforce, a bilingual nearshore customer support company
powered by WNRS. Audience: U.S. ops / CX / support leaders evaluating outsourcing.

## Workflow per run
1. Read `content-queue.yaml`. Take the next item with `status: todo`.
2. Run a web search for at least one current stat or fresh angle. Every post must
   contain something not already on page one of Google. No rewrites.
3. Draft to the article template and the rules below.
4. Create `src/content/blog/<slug>.md` with full frontmatter (schema in
   `src/content/config.ts`). Use the `publishDate` from the queue item.
5. Set the queue item to `status: done`.
6. Open a PR titled `post: <title>` (or commit to a `content` branch).

## Frontmatter (matches src/content/config.ts)
- `title` (H1, can be long), `metaTitle` (optional `<title>`, ≤60 chars incl. "| Teleforce";
  set this when the H1 is long), `description` (140–155 chars), `excerpt` (card teaser),
  `primaryKeyword`, `category` (Nearshore | Bilingual CX | Operations | Collections),
  `readMinutes`, `publishDate` (from queue), `related` (2 sibling slugs),
  optional `faq` (BoFu posts: 3–4 `{q, a}` entries).

## Voice & quality
- Direct, concrete, no hype or filler. Short paragraphs. Scannable H2/H3.
- One genuine POV or data point per post. Acknowledge tradeoffs honestly
  (e.g. when offshore or in-house is the right call). Credibility > salesmanship.
- 900–1,400 words for cluster posts; 2,000+ for pillar pages.

## SEO rules (non-negotiable)
- Primary keyword in: H1, first 100 words, one H2, meta title, slug.
- Meta title ≤ 60 chars, ends "| Teleforce" (the template appends it — keep the
  `title` itself tight). Meta description 140–155 chars.
- 3–5 internal links: 2 sibling posts (`/blog/<slug>`) + `/#pricing` or `/#contact`.
- One mid-article CTA (a `>` blockquote callout, styled as a CTA box) + one end CTA
  to `/#contact` (the template renders a standard end CtaBox automatically).
- BoFu posts: add 3–4 FAQ entries in frontmatter for FAQ schema.

## Brand rules
- "Powered by WNRS." Logos = WNRS's clients, proving infrastructure — never claim
  Teleforce served them. Stats: 30+ years, 20+ industries served, Fortune 500 backbone
  (never abbreviate as "F500"). Teleforce itself is fully English/Spanish bilingual —
  do NOT claim "20+ languages" (that diluted, inflated framing is retired). No headcount,
  no hub count. Never invent client names or case studies.
- Never publish costs, margins, or internal economics. Public prices only (NO hourly
  rate, never cite $16): Part-time $1,400/seat/mo, Full-time (Dedicated) $2,800/seat/mo,
  Team custom.
- Teleforce's delivery hub is ECUADOR. Position Ecuador as a strength (accent-neutral
  Spanish, strong U.S. time overlap, high retention, lower attrition) — NEVER as the
  cheap / low-volume / "smaller ecosystem" option.
- These posts are SALES ASSETS. Every post concludes by pointing the reader toward
  Teleforce. Acknowledge tradeoffs only briefly, then land firmly on us.
- Teleforce sells TWO flagship lines: (1) bilingual customer support, and (2) first-party
  pre-delinquent & early-stage collections (cobranza). Collections is a differentiator —
  recovered revenue, not just cost savings; native-Spanish outreach reaches Hispanic
  accounts; first-party (in the client's name) protects the relationship. Weave the
  collections angle into billing/AR/financial-services/operations posts where natural.
- COLLECTIONS PRICING IS NOT PUBLISHED. Never quote the $1,400/$2,800 seat rates (or any
  number) for collections — say "contact us for pricing" / "scoped per program." The seat
  prices apply to SUPPORT only. (Keeps Teleforce from cannibalizing WNRS on collections.)
- DO NOT disparage third-party collections agencies — WNRS operates in that space. Frame
  first-party vs third-party as a STAGE difference (first-party = early/relationship-
  preserving; third-party = a legitimate tool for late-stage/charged-off accounts). Banned
  framing: "stranger," "adversarial," "dread," "cents on the dollar," "taking a cut,"
  "relationship damage of a third-party agency," or implying agencies are predatory.
- Collections compliance: be accurate. First-party collections (in the creditor's name)
  generally fall outside the FDCPA, but TCPA still governs calls/texts. Never overstate
  legal claims; keep it directional, not legal advice.

## Anti-spam (Google scaled-content-abuse policy)
- Quality cadence over firehose. Each post targets a DISTINCT real query.
- Never mass-produce near-duplicate posts off one template with nothing new.
- If the queue item has no genuine distinct angle, flag it instead of padding.
- publishDate staggering (set in the queue) drips posts out over months — do not
  collapse them onto one date.

## Markdown conventions
- Use `## H2` / `### H3`, `-` bullets, `1.` numbered lists, `**bold**`, `*italics*`,
  and standard Markdown tables (styled by global.css). Do NOT embed Astro components
  or import statements — posts are plain Markdown.
- The mid-article CTA is a blockquote:
  `> **Hook.** One or two sentences. [Book a call →](/#contact)`
