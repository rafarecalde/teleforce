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
// Name, email, and phone are collected in Google's form. The schedule cannot
// redirect to /thankyou/ after a booking, and the embed emits no completed-booking
// event, so this widget does not fire an Ads conversion.
export const GOOGLE_EMBED_URL = 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ2fo1Aew3luWIG34QpfXxW8rUjtxlSX88hS5s6oTdnGK7q5pBt2eVDW45meyPzZq-hbfkLFqfc6?gv=true';

// Onboarding scheduler. Calendly can send the visitor to /thankyou/ from the
// event's confirmation settings. The portal uses the same URL.
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
// Signup puts terms and a card on file. Nothing is charged at signup.
// Billing starts at kickoff or 3 business days after acceptance, whichever is first,
// or the day of automatic acceptance. Then the same day each month.
// Onboarding is about 30 minutes. Matched in about a week. Live in about two weeks.
// One swap before acceptance. Two rematches a year after kickoff. Departures don't count.
export const EA_JOURNEY_LINE =
  'Onboarding → Get matched → Kickoff';

export const EA_ONBOARDING_STEP = {
  title: 'Onboarding',
  body: 'One onboarding call, about 30 minutes, with a prep sheet beforehand. We cover what to delegate, your priorities, hours, tools, and how you like to work. Then your Partnership Manager starts your match.',
} as const;

export const EA_MATCH_STEP = {
  title: 'Get matched with your EA',
  body: 'About a week later, your Meet-your-EA package arrives by branded email and in the portal: an intro video, background on your Assistant, and your Partnership Manager. Accept EA with one click from the email or the portal — or swap once, and we’ll bring you one more. You have 3 business days to choose. We’ll remind you about 24 hours before. If you don’t, the match is accepted.',
} as const;

export const EA_KICKOFF_STEP = {
  title: 'Kickoff',
  body: 'Book kickoff right from that email or the portal. You’re live, usually the same day you accept or the next business day, and typically within about two weeks of onboarding. You and your EA run the day-to-day. Your Partnership Manager stays close for oversight, tools guidance, best practices, and up to two rematches a year.',
} as const;

export const EA_TIMING_LINE =
  'Onboarding call about 30 minutes. Matched in about a week. Live in about two weeks.';

export const EA_PAY_LINE =
  'Nothing is charged at signup. Billing starts at kickoff or 3 business days after you accept — whichever comes first — or the day your match is accepted automatically. Then the same day each month.';

// Short footnote under pricing bullets. The full clock stays in the Terms.
export const EA_PRICING_NOTE_LEAD =
  'Start on the 3-month plan. Switch to 12 when you’re ready and save';
export const EA_PRICING_NOTE_TAIL =
  'Nothing is charged at signup. Billing starts at kickoff or 3 business days after you accept — whichever comes first — or the day your match is accepted automatically. Then the same day each month. Taxes extra.';

// Warm billing line for FAQ answers. Legal detail stays on the Terms page.
export const EA_CLOCK_NOTE = EA_PAY_LINE;

export const EA_START_FAQ = {
  q: 'How fast do I get matched with my EA?',
  a: 'Onboarding is about 30 minutes. You’re matched in about a week with a Meet-your-EA package — intro video, background, and your Partnership Manager — by branded email and in the portal. Accept EA with one click. You’re typically live within about two weeks. Book kickoff from that same email or the portal.',
} as const;

export const EA_CANCEL_FAQ = {
  q: 'What if I need to cancel or change my match?',
  a: 'Cancel free anytime before you accept your match. You can swap once before you accept — two EAs at most. You have 3 business days to accept or swap, with a reminder about 24 hours before; if you don’t choose, the match is accepted. After kickoff, two rematches a year. If your EA leaves, that never counts, and we present someone new within 10 business days.',
  linkHref: '/terms',
  linkLabel: 'See Terms',
} as const;

export const EA_TIME_OFF_FAQ = {
  q: 'What about holidays and days off?',
  a: 'Your EA observes local public holidays and takes five days off a year. Your monthly fee continues, and we’ll do our best to cover those days at no extra charge.',
  linkHref: '/terms',
  linkLabel: 'See Terms',
} as const;

export const EA_RENEW_FAQ = {
  q: 'Does my plan renew?',
  a: 'Yes. After your first term — 90 days or 12 months — it renews for the same length unless you or we give notice at least 60 days before it ends.',
  linkHref: '/terms',
  linkLabel: 'See Terms',
} as const;

export type FaqStep = { label: string; detail: string };

/** Plain text for FAQPage JSON-LD. UI renders `steps` as a list. */
export function faqAnswerText(item: {
  a: string;
  steps?: readonly FaqStep[];
  tail?: string;
  linkHref?: string;
  linkLabel?: string;
}): string {
  const steps = (item.steps ?? []).map((step) => `${step.label} — ${step.detail}`);
  const link = item.linkHref ? `${item.linkLabel || 'See Terms'} (${item.linkHref})` : '';
  return [item.a, ...steps, item.tail ?? '', link].filter((part) => part.length > 0).join(' ');
}

export const EA_JOURNEY_FAQ = [
  {
    // Short on purpose. Onboarding, match speed, kickoff timing, billing, and the 90-day clock have their own answers.
    q: 'What do next steps look like?',
    a: 'Signup, accept the Terms, choose your plan, and put a card on file. Then three steps.',
    steps: [
      {
        label: 'Onboarding',
        detail: 'about a 30-minute call, with a prep sheet beforehand; your Partnership Manager starts matching after',
      },
      {
        label: 'Get matched',
        detail: 'your Meet-your-EA package arrives by branded email and in the portal in about a week — Accept EA with one click, or swap once within 3 business days',
      },
      {
        label: 'Kickoff',
        detail: 'book it from the email or the portal; you’re live, usually the same day you accept or the next business day',
      },
    ],
    tail: EA_TIMING_LINE,
  },
  {
    q: 'What does onboarding look like?',
    a: 'One onboarding call, about 30 minutes, with a prep sheet beforehand. We cover what to delegate, your priorities, hours, tools, and how you like to work. Your Partnership Manager starts your match after that.',
  },
  EA_START_FAQ,
  {
    q: 'After I accept, when does kickoff start?',
    a: 'Book kickoff from the email or the portal. Usually the same day you accept, or the next business day. You and your EA run the day-to-day. Your Partnership Manager stays on for oversight, tools guidance, best practices, and up to two rematches a year.',
  },
  {
    q: 'When does the 90-day commitment start?',
    a: EA_CLOCK_NOTE,
    linkHref: '/terms',
    linkLabel: 'See Terms',
  },
  {
    q: 'When am I charged?',
    a: EA_CLOCK_NOTE,
    linkHref: '/terms',
    linkLabel: 'See Terms',
  },
  EA_CANCEL_FAQ,
  EA_TIME_OFF_FAQ,
  EA_RENEW_FAQ,
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
