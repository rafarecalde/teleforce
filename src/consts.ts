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

// Onboarding scheduler. This is the Calendly URL the marketing site embedded
// before discovery booking moved to Google Calendar. The portal uses the same URL.
export const ONBOARDING_CALENDLY_URL = 'https://calendly.com/tryteleforce-sales';

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
] as const;

export const FOOTER_LINKS = [
  { href: '/#pricing', label: 'EA pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Signal' },
  { href: '/#contact', label: 'Get matched' },
] as const;

// Blog categories — matches src/content/config.ts. Live posts are Virtual Assistance.
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
// First month and the 90-day commitment both begin at kickoff, or 3 business days after the client is matched, whichever comes first.
// Never say 3 business days after onboarding — that can bill during matching.
// Teleforce is ready on match day; post-match delay is on the client.
export const EA_JOURNEY_LINE =
  'Onboarding → Get matched → Kickoff';

export const EA_ONBOARDING_STEP = {
  title: 'Onboarding',
  body: 'Post-signup: one deep onboarding call (~60 minutes). You get a prep sheet beforehand. We cover what to delegate, priorities, hours, tools, and how you like to communicate. You leave with a personalized kickoff plan. Your partnership manager owns matching after this call.',
} as const;

export const EA_MATCH_STEP = {
  title: 'Get matched with your EA',
  body: 'You’re matched. Meet your executive assistant — selected from the top tier after we reject most applicants so you don’t have to. Your EA is an adaptable partner trained for strategic work across a wide range of tasks, with AI multiplying their capabilities beyond typical admin support.',
} as const;

// Rematch stays here and in FAQ. The billing clock (kickoff, or 3 business days after match) stays in FAQ / T&Cs only.
export const EA_KICKOFF_STEP = {
  title: 'Kickoff',
  body: 'Service starts. Same day or next business day after you’re matched, your EA goes live. You and your EA run the day-to-day. Your partnership manager stays for oversight, tools, and best practices — full back-end support, including rematch.',
} as const;

export const EA_TIMING_LINE =
  'Matched in days. Live within a week.';

export const EA_PAY_LINE = 'You don’t pay until your EA starts.';

// Short footnote under pricing bullets. The kickoff, 3 business days, and 90-day rule stays in FAQ.
export const EA_PRICING_NOTE_LEAD =
  'Start on the 3-month plan. Switch to 12 when you’re ready and save';
export const EA_PRICING_NOTE_TAIL =
  'You don’t pay until your EA starts. Terms and conditions apply.';

// Full billing rule for FAQ answers only — not the pricing-card footnote.
export const EA_CLOCK_NOTE =
  'You don’t pay until your EA starts. Signup puts terms and a payment method on file with no charge yet. The first month and the 90-day commitment both begin at kickoff — when your EA goes live — or 3 business days after you’re matched, whichever comes first.';

export const EA_START_FAQ = {
  q: 'How fast do I get matched with my EA?',
  a: 'You’re matched in about 3 days from the onboarding call, with an executive assistant from the top tier.',
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
    a: 'Signup, review and accept our terms and conditions, select your plan, and set a payment method on file. Then three steps.',
    steps: [
      {
        label: 'Onboarding',
        detail: 'one deep ~60-min call (prep sheet beforehand; you leave with a personalized kickoff plan; partnership manager owns matching after)',
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
    a: 'Post-signup: one deep onboarding call (~60 minutes). You get a prep sheet beforehand. The call covers what to delegate, priorities, hours, tools, and how you like to communicate. You leave with a personalized kickoff plan. Your partnership manager owns matching after that.',
  },
  EA_START_FAQ,
  {
    q: 'After being matched, when does kickoff start?',
    a: 'Same day or the next business day after you’re matched — or later if you need, up to 3 business days from matching. You and your EA run the day-to-day. Your partnership manager stays on with oversight, tools, best practices, and rematch. You don’t pay until your EA starts.',
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
    name: 'Jessica Simon',
    company: 'Bioceramics',
    img: '/brand/customers/simon.jpg',
    avatar: '/brand/customers/simon-avatar.jpg',
  },
];
