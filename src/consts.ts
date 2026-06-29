// ============================================================
// Brand facts — single source of truth. Do not deviate (see brief §1).
// ============================================================

export const SITE = {
  name: 'Teleforce',
  url: 'https://tryteleforce.com',
  title: 'Teleforce — Bilingual Customer Support',
  description:
    'Bilingual customer support for U.S. companies — dedicated English/Spanish agents, on U.S. time, powered by the WNRS network.',
  tagline: 'Bilingual customer support · Nearshore · Powered by WNRS',
  poweredBy: 'Powered by WNRS',
  // Forms post to FormSubmit.co (no account; confirm once via email on first send).
  // After activation you can swap this for the FormSubmit alias to hide the address.
  contactEmail: 'rrlegal82@gmail.com',
} as const;

// FormSubmit endpoint for the lead/subscribe forms.
export const FORM_ACTION = `https://formsubmit.co/${SITE.contactEmail}`;

// Proof stats — exact. Never add an agent headcount. (Hubs intentionally omitted.)
export const STATS = [
  { n: '30+', k: 'Years operating' },
  { n: '20+', k: 'Languages covered' },
  { n: 'Fortune 500', k: 'Trusted backbone' },
] as const;

// WNRS's clients. Render as the "Powered by WNRS / trusted by" wall —
// the logos prove WNRS's infrastructure, never that Teleforce served them.
export const LOGOS = [
  'UPS', 'American Express', 'SAP', 'Procter & Gamble',
  'Nike', 'Maersk', 'Carnival', 'Avis',
  'Aeroméxico', 'Ternium', 'Intertek', 'Cemex',
] as const;

export const NAV_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Signal' },
] as const;

export const FOOTER_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog', label: 'Signal' },
  { href: '/#contact', label: 'Contact' },
] as const;

export const CATEGORIES = ['Nearshore', 'Bilingual CX', 'Operations'] as const;
export type Category = (typeof CATEGORIES)[number];
