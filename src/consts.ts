// ============================================================
// Brand facts — single source of truth. Do not deviate (see brief §1).
// ============================================================

export const SITE = {
  name: 'Teleforce',
  url: 'https://tryteleforce.com',
  title: 'Executive Assistants | Elite Dedicated Talent | Teleforce',
  description:
    'Hire a dedicated, full-time executive assistant from the top tier of bilingual talent — rigorously vetted, career professionals, in your time zone. From $2,700/mo.',
  tagline: 'Elite bilingual executive assistants · English/Spanish · U.S. hours',
  backbone: '30 years of Fortune 500 operating history',
} as const;

// Where lead/subscribe forms deliver. FormSubmit.co requires a ONE-TIME activation:
// the first submission triggers a confirmation email to this address — click the
// link once and every submission after that is delivered.
// FormSubmit alias for sales@tryteleforce.com — keeps the raw email out of the
// page HTML. Requires the one-time "Activate Form" click from FormSubmit's email.
export const FORM_EMAIL = 'sales@tryteleforce.com';
export const FORM_ALIAS = 'b51bbe084a1d3308de0df272e7e8dd49';
export const FORM_ACTION = `https://formsubmit.co/${FORM_ALIAS}`;

// Google Calendar appointment scheduling — inline booking widget (?gv=true embed).
// Booking happens on Google (name/email/phone collected there), so there is no
// completed-booking event; BookingSection counts the "Book a call" click as the
// Google Ads conversion signal.
export const GOOGLE_EMBED_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2fo1Aew3luWIG34QpfXxW8rUjtxlSX88hS5s6oTdnGK7q5pBt2eVDW45meyPzZq-hbfkLFqfc6?gv=true';

// Proof stats — exact. Never add an agent headcount. (Hubs intentionally omitted.)
export const STATS = [
  { n: '30+', k: 'Years operating' },
  { n: '20+', k: 'Industries served' },
  { n: 'Fortune 500', k: 'Operating history' },
] as const;

// Enterprise clients served across the network. Rendered as the "trusted by" wall.
export const LOGOS = [
  'UPS', 'American Express', 'SAP', 'Procter & Gamble',
  'Nike', 'Maersk', 'Carnival', 'Avis',
  'Aeroméxico', 'Ternium', 'Intertek', 'Cemex',
] as const;

export const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog', label: 'Signal' },
] as const;

export const FOOTER_LINKS = [
  { href: '/#pricing', label: 'EA pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Signal' },
  { href: '/#contact', label: 'Get matched' },
] as const;

// Blog categories — kept broad so the full SEO cluster (incl. legacy Tech Support
// and Account Servicing posts) stays valid even though those aren't featured services.
export const CATEGORIES = [
  'Customer Service',
  'Tech Support',
  'Data Entry',
  'Appointment Setting',
  'Account Servicing',
  'Sales & Lead Gen',
  'Nearshore',
  'Virtual Assistance',
] as const;
export type Category = (typeof CATEGORIES)[number];

// ============================================================
// Service menu — single source for the /services pages, the homepage grid,
// and per-service blog clusters. `category` ties a service to its blog tag.
// `seatPriced: false` means "contact us for pricing" (per-program).
// ============================================================
export interface Service {
  slug: string;
  name: string;
  navLabel: string;
  short: string; // one-liner for cards
  tagline: string; // service-page hero line
  intro: string; // lead paragraph
  included: string[];
  category: Category;
  seatPriced: boolean;
  ic: string; // mono accent label on the card
}

// Featured BPO seats for /services and service LPs. Homepage is EA-first
// and does not render this grid.
export const SERVICES: Service[] = [
  {
    slug: 'customer-service',
    name: 'Customer Service',
    navLabel: 'Customer Service',
    ic: 'VOICE · CHAT · EMAIL',
    short: 'Bilingual inbound support that sounds like your brand.',
    tagline: 'Support that sounds like your brand — in both languages.',
    intro:
      'Inbound customer support across phone, live chat, and email — native English and Spanish from one seat, on U.S. business hours. Named agents trained on your product and your voice, who your customers can’t tell from in-house staff.',
    included: [
      'Voice, live chat, and email support on your tools and your SLAs',
      'Native English/Spanish from a single seat — no language routing',
      'Named agents trained on your product as brand staff',
      'QA, reporting, and a named point of contact from day one',
      'U.S.-hours coverage with same-day feedback loops',
    ],
    category: 'Customer Service',
    seatPriced: true,
  },
  {
    slug: 'data-entry',
    name: 'Data Entry',
    navLabel: 'Data Entry',
    ic: 'BACK OFFICE',
    short: 'Accurate back-office data work, off your plate.',
    tagline: 'Accurate back-office data work, off your plate.',
    intro:
      'Order entry, CRM hygiene, document processing, and data cleanup handled accurately by a managed bilingual team — so your in-house people stop spending nights in spreadsheets.',
    included: [
      'Order, claim, and form entry',
      'CRM and database hygiene / de-duplication',
      'Document and PDF processing and digitization',
      'QA and double-key verification for accuracy',
      'Flexible volume — scale up for peaks, down for lulls',
    ],
    category: 'Data Entry',
    seatPriced: true,
  },
  {
    slug: 'appointment-setting',
    name: 'Appointment Setting',
    navLabel: 'Appointment Setting',
    ic: 'INBOUND · OUTBOUND',
    short: 'More booked appointments, fewer no-shows.',
    tagline: 'A fuller calendar — and fewer no-shows.',
    intro:
      'Inbound and outbound scheduling for sales and service teams. Bilingual reps qualify, book, and confirm — filling your calendar with the right prospects and reminding them so they show up.',
    included: [
      'Outbound and inbound appointment scheduling',
      'Lead qualification before the booking',
      'Confirmations and reminders to cut no-shows',
      'Calendar and CRM integration',
      'Bilingual outreach for English- and Spanish-speaking prospects',
    ],
    category: 'Appointment Setting',
    seatPriced: true,
  },
  {
    slug: 'sales-lead-generation',
    name: 'Sales Lead Generation',
    navLabel: 'Sales & Lead Gen',
    ic: 'LISTS · LEADS',
    short: 'A bilingual top-of-funnel engine — lists, outreach, qualified leads.',
    tagline: 'A bilingual pipeline engine for your sales team.',
    intro:
      'Outbound prospecting, list building, and lead qualification that feeds your closers a steady stream of qualified, bilingual-ready leads — including the Hispanic market an English-only team can’t reach.',
    included: [
      'Outbound prospecting and cold outreach',
      'Lead qualification and scoring before handoff',
      'List building and CRM enrichment',
      'Warm handoff or appointment booking for your closers',
      'Bilingual outreach into English- and Spanish-speaking markets',
    ],
    category: 'Sales & Lead Gen',
    seatPriced: true,
  },
  {
    slug: 'sdr-bdr',
    name: 'SDR / BDR Teams',
    navLabel: 'SDR / BDR',
    ic: 'OUTBOUND · MEETINGS',
    short: 'Dedicated outbound reps who book qualified meetings.',
    tagline: 'Dedicated SDRs and BDRs who fill your pipeline with qualified meetings.',
    intro:
      'Dedicated, bilingual nearshore SDRs and BDRs who own your outbound — prospecting, sequencing, calling, and qualifying — and hand your closers booked, sales-ready meetings. Reps trained on your ICP and your pitch, on U.S. hours, at a fraction of a U.S. in-house rep.',
    included: [
      'Dedicated outbound reps, ramped on your ICP and pitch',
      'Multi-touch sequences across call, email, and LinkedIn',
      'Lead qualification against your criteria before handoff',
      'Booked, confirmed meetings on your closers’ calendars',
      'Bilingual outreach into English- and Spanish-speaking markets',
      'CRM logging, reporting, and a named team lead',
    ],
    category: 'Sales & Lead Gen',
    seatPriced: true,
  },
];

// Legacy services — no longer part of the featured offering, but kept live so the
// blog's internal links and existing SEO don't 404. Not shown in nav/grids.
export const SERVICES_LEGACY: Service[] = [
  {
    slug: 'tech-support',
    name: 'Tech Support',
    navLabel: 'Tech Support',
    ic: 'TIER 1 · TIER 2',
    short: 'Tier 1–2 technical support that resolves, not just deflects.',
    tagline: 'Technical support that actually resolves — in two languages.',
    intro:
      'Bilingual Tier 1 and Tier 2 technical support for software and hardware products — troubleshooting, onboarding, and product help from agents who can resolve the issue, not just route the ticket.',
    included: [
      'Tier 1–2 troubleshooting across phone, chat, and email',
      'Ticketing, triage, and clean escalation paths',
      'Product onboarding and how-to guidance',
      'Knowledge-base authoring and upkeep',
      'Bilingual coverage on U.S. hours',
    ],
    category: 'Tech Support',
    seatPriced: true,
  },
  {
    slug: 'billing-account-servicing',
    name: 'Billing & Account Servicing',
    navLabel: 'Account Servicing',
    ic: 'FIRST-PARTY · 1–60 DAYS',
    short: 'Keep accounts current — in your brand’s voice.',
    tagline: 'Keep accounts current, without souring the relationship.',
    intro:
      'First-party, pre-delinquency and early-stage account servicing, conducted in your name — billing questions, payment reminders, and friendly early outreach that keep accounts current before they age. Native-Spanish reach to Hispanic customers, relationship-preserving by design.',
    included: [
      'Billing and payment-question support',
      'Pre-delinquency payment reminders — first-party, in your name',
      'Early-stage (1–60 day) account servicing',
      'Native-Spanish outreach to Hispanic accounts',
      'Consent-aware outbound, set up at onboarding',
    ],
    category: 'Account Servicing',
    seatPriced: false,
  },
];

// Every service that still has a live /services/<slug> page (featured + legacy).
export const ALL_SERVICES: Service[] = [...SERVICES, ...SERVICES_LEGACY];

// ============================================================
// Executive Assistant product (homepage) — a dedicated, full-time bilingual EA.
// Modeled on the premium delegation category; priced simply and flat.
// ============================================================
// One dedicated full-time EA, two commitments. Start on the 3-month plan.
// Switch to 12 when you’re ready and save $300/mo. Early switch is fine, including in month one.
export const EA = {
  price12mo: 2700, // USD/mo on a 12-month commitment
  price3mo: 3000, // USD/mo on a 3-month commitment
} as const;

// Client journey — single source for homepage, EA LPs, and FAQ.
// Discovery and signup come before the numbered path. Three named steps:
// Chip / arrow line stays short: Onboarding → Get matched → Kickoff.
// The numbered step card keeps the full title: Get matched with your EA.
// Step 2 is a confident match from the top tier. Rematch stays in kickoff and FAQ, not in this step.
// Signup is terms and a payment method on file. No charge yet.
// First month and the 90-day commitment both begin at kickoff, or up to 10 days after the client is matched and has accepted their EA, whichever comes first.
// Never say 10 days after onboarding — that can bill during matching.
// Teleforce is ready on match day; post-match delay is on the client.
export const EA_JOURNEY_LINE =
  'Onboarding → Get matched → Kickoff';

export const EA_ONBOARDING_STEP = {
  title: 'Onboarding',
  body: 'Post-signup: one deep onboarding call (~60 minutes). You get a prep sheet beforehand. We cover what to delegate, priorities, hours, tools, and how you like to communicate. Your partnership manager owns matching after this call. Within 24–48 hours: a short written plan and an access checklist.',
} as const;

export const EA_MATCH_STEP = {
  title: 'Get matched with your EA',
  body: 'You’re matched. Meet your executive assistant — selected from the top tier after we reject most applicants so you don’t have to. Your EA is an adaptable partner trained for strategic work across a wide range of tasks, with AI multiplying their capabilities beyond typical admin support.',
} as const;

// Rematch stays here and in FAQ. The billing clock (kickoff, or up to 10 days after match) stays in FAQ / T&Cs only.
export const EA_KICKOFF_STEP = {
  title: 'Kickoff',
  body: 'Service starts. Same day or next business day after you’re matched, your EA goes live. You and your EA run the day-to-day. Your partnership manager stays for oversight, tools, and best practices — full back-end support, including rematch.',
} as const;

export const EA_TIMING_LINE =
  'Matching ~1 week · Live under ~2 weeks.';

export const EA_PAY_LINE = 'You don’t pay until your EA starts.';

// Short footnote under pricing bullets. The kickoff, up to 10 days, and 90-day rule stays in FAQ.
export const EA_PRICING_NOTE_LEAD =
  'Start on the 3-month plan. Switch to 12 when you’re ready and save';
export const EA_PRICING_NOTE_TAIL =
  'You don’t pay until your EA starts. Terms and conditions apply.';

// Full billing rule for FAQ answers only — not the pricing-card footnote.
export const EA_CLOCK_NOTE =
  'You don’t pay until your EA starts. Signup puts terms and a payment method on file with no charge yet. The first month and the 90-day commitment both begin at kickoff — when your EA goes live — or up to 10 days after you’ve been matched / accepted your EA, whichever comes first.';

export const EA_START_FAQ = {
  q: 'How fast can I start / get matched with my EA?',
  a: 'Matching is about a week from the onboarding call. You’re live in under about two weeks. You’re matched with an executive assistant from the top tier. You and your EA run the day-to-day. Your partnership manager stays on with oversight, tools, best practices, and rematch. You don’t pay until your EA starts. The first month and the 90-day commitment both begin at kickoff — when your EA goes live — or up to 10 days after you’ve been matched / accepted your EA, whichever comes first.',
} as const;

export type FaqStep = { label: string; detail: string };

/** Plain text for FAQPage JSON-LD. UI renders `steps` as a list. */
export function faqAnswerText(item: {
  a: string;
  steps?: readonly FaqStep[];
  tail?: string;
}): string {
  const steps = (item.steps ?? []).map((step) => `${step.label} — ${step.detail}`);
  return [item.a, ...steps, item.tail ?? ''].filter((part) => part.length > 0).join(' ');
}

export const EA_JOURNEY_FAQ = [
  {
    // Short on purpose. Onboarding, match speed, kickoff timing, billing, and the 90-day clock have their own answers.
    q: 'What do next steps look like?',
    a: 'Signup, review and accept our terms and conditions, select your plan, and set a payment method on file. Don’t worry, you won’t be charged until your EA starts. Then three steps.',
    steps: [
      {
        label: 'Onboarding',
        detail: 'one deep ~60-min call (prep sheet beforehand; plan + access checklist within 24–48 hours)',
      },
      {
        label: 'Get matched',
        detail: 'you’re matched with your EA from the top tier',
      },
      {
        label: 'Kickoff',
        detail: 'service starts; same day or next business day after you’re matched',
      },
    ],
    tail: EA_TIMING_LINE,
  },
  {
    q: 'What does onboarding look like?',
    a: 'Post-signup: one deep onboarding call (~60 minutes). You get a prep sheet beforehand. The call covers what to delegate, priorities, hours, tools, and how you like to communicate. Your partnership manager owns matching after that. Within 24–48 hours you get a short written plan and an access checklist. Next, you’re matched. Meet your executive assistant — selected from the top tier after we reject most applicants so you don’t have to. Your EA is an adaptable partner trained for strategic work across a wide range of tasks, with AI multiplying their capabilities beyond typical admin support. Rematch is available if the fit isn’t right. Most clients are matched within about a week of the call and are live in under about two weeks.',
  },
  EA_START_FAQ,
  {
    q: 'After being matched, when does kickoff start?',
    a: 'Same day or the next business day after you’re matched — or later if you need, up to 10 days from matching.',
  },
  {
    q: 'When does the 90-day commitment start?',
    a: EA_CLOCK_NOTE,
  },
  {
    q: 'When am I charged?',
    a: EA_CLOCK_NOTE,
  },
] as const;

// Real contact + social proof pulled from the live Teleforce brand page.
export const PHONE = '1-866-252-3961';
export const PHONE_HREF = 'tel:+18662523961';

export interface Testimonial {
  quote: string;
  name: string;
  company: string;
  img: string;
  avatar: string;
}
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I stopped drowning in inbox and calendar noise. My Teleforce EA owns the day-to-day so I can actually run the company.',
    name: 'Emilio Strauch',
    company: 'Microtech, Inc.',
    img: '/brand/customers/strauch.jpg',
    avatar: '/brand/customers/strauch-avatar.jpg',
  },
  {
    quote:
      'I’m on the East Coast — nearshore Teleforce beats the offshore setups I tried. Same-day hours, not overnight lag.',
    name: 'Eduardo Dávila',
    company: 'Bioceramics',
    img: '/brand/customers/davila.jpg',
    avatar: '/brand/customers/davila-avatar.jpg',
  },
];
