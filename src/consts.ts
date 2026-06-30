// ============================================================
// Brand facts — single source of truth. Do not deviate (see brief §1).
// ============================================================

export const SITE = {
  name: 'Teleforce',
  url: 'https://tryteleforce.com',
  title: 'Teleforce — Bilingual Customer Support',
  description:
    'Bilingual LATAM BPO for U.S. companies — customer service, tech support, data entry, appointment setting, first-party collections, and lead gen. English/Spanish, on U.S. time, on a Fortune 500-grade support backbone.',
  tagline: 'Bilingual LATAM BPO · English/Spanish · Support, collections & more',
  backbone: 'a Fortune 500-grade support backbone',
  // Forms post to FormSubmit.co. Activated; using the FormSubmit alias so the
  // real inbox (rrlegal82@gmail.com) is never exposed in the page HTML.
  formAlias: 'e32285ee2449a6d080938e3900354954',
} as const;

// FormSubmit endpoint for the lead/subscribe forms.
export const FORM_ACTION = `https://formsubmit.co/${SITE.formAlias}`;

// Proof stats — exact. Never add an agent headcount. (Hubs intentionally omitted.)
export const STATS = [
  { n: '30+', k: 'Years operating' },
  { n: '20+', k: 'Industries served' },
  { n: 'Fortune 500', k: 'Trusted backbone' },
] as const;

// Enterprise clients served across the network. Rendered as the "trusted by" wall.
export const LOGOS = [
  'UPS', 'American Express', 'SAP', 'Procter & Gamble',
  'Nike', 'Maersk', 'Carnival', 'Avis',
  'Aeroméxico', 'Ternium', 'Intertek', 'Cemex',
] as const;

export const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Signal' },
] as const;

export const FOOTER_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog', label: 'Signal' },
  { href: '/#contact', label: 'Contact' },
] as const;

// Blog categories — the six services are the pillars, plus Nearshore as a
// cross-cutting pillar for delivery-model / hub-comparison posts.
export const CATEGORIES = [
  'Customer Service',
  'Tech Support',
  'Data Entry',
  'Appointment Setting',
  'Billing & Collections',
  'Sales & Lead Gen',
  'Nearshore',
] as const;
export type Category = (typeof CATEGORIES)[number];

// ============================================================
// Service menu — single source for the /services pages, the homepage grid,
// and per-service blog clusters. `category` ties a service to its blog tag.
// `seatPriced: false` means "contact us for pricing" (collections).
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
    slug: 'billing-collections',
    name: 'First-Party Billing & Collections',
    navLabel: 'Billing & Collections',
    ic: 'PRE-DELINQUENT · 1–60 DAYS',
    short: 'Recover revenue without losing the customer.',
    tagline: 'Recover revenue without losing the customer.',
    intro:
      'First-party, pre-delinquent and early-stage accounts-receivable outreach, conducted in your name. Friendly bilingual contact in the early delinquency buckets where recovery rates are highest — and where tone protects the relationship you paid to build.',
    included: [
      'Pre-delinquent reminders before an account ages past due',
      'Early-stage (1–60 day) recovery in your brand’s name',
      'Native-Spanish outreach that reaches Hispanic accounts',
      'First-party — you keep the customer relationship',
      'Flexible pricing: by hire, by seat, or per program',
    ],
    category: 'Billing & Collections',
    seatPriced: false,
  },
  {
    slug: 'sales-lead-generation',
    name: 'Sales Lead Generation',
    navLabel: 'Sales & Lead Gen',
    ic: 'OUTBOUND · SDR',
    short: 'A bilingual pipeline engine for your sales team.',
    tagline: 'A bilingual pipeline engine for your sales team.',
    intro:
      'Outbound prospecting, lead qualification, and SDR support that feeds your closers a steady stream of qualified, bilingual-ready leads — including the Hispanic market an English-only team can’t reach.',
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
];

// Two engagement models (pricing is quote-based — no public numbers).
export interface Model {
  tag: string;
  name: string;
  blurb: string;
  includes: string[];
  note: string;
  feature?: boolean;
}

export const MODELS: Model[] = [
  {
    tag: 'Recruitment',
    name: 'Flat-fee placement',
    blurb:
      'We source, screen, and interview qualified LATAM agents. You interview, you hire, and you manage and pay them directly.',
    includes: [
      'Sourcing, screening, and interviews',
      'Basic background checks',
      'A shortlist of qualified candidates',
      '60–90 day free replacement guarantee',
    ],
    note: 'Flat fee per hire, or a low early-stage contingency.',
  },
  {
    tag: 'Managed BPO',
    name: 'Full-time equivalent (FTE) seat',
    blurb:
      'We run the whole operation. Dedicated agents work as your team; we handle everything behind them.',
    includes: [
      'Salary, payroll, and HR',
      'Recruiting and replacement',
      'Facilities and IT',
      'QA, reporting, and a named lead',
    ],
    note: 'All-inclusive monthly seat, priced by role and skill.',
    feature: true,
  },
];
