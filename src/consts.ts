// ============================================================
// Brand facts — single source of truth. Do not deviate (see brief §1).
// ============================================================

export const SITE = {
  name: 'Teleforce',
  url: 'https://tryteleforce.com',
  title: 'Teleforce — Bilingual Customer Support',
  description:
    'Bilingual customer support and early-stage collections for U.S. companies — dedicated English/Spanish agents, on U.S. time, powered by the WNRS network.',
  tagline: 'Bilingual support & collections · Nearshore · Powered by WNRS',
  poweredBy: 'Powered by WNRS',
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

// WNRS's clients. Render as the "Powered by WNRS / trusted by" wall —
// the logos prove WNRS's infrastructure, never that Teleforce served them.
export const LOGOS = [
  'UPS', 'American Express', 'SAP', 'Procter & Gamble',
  'Nike', 'Maersk', 'Carnival', 'Avis',
  'Aeroméxico', 'Ternium', 'Intertek', 'Cemex',
] as const;

export const NAV_LINKS = [
  { href: '/#services', label: 'Support' },
  { href: '/#collections', label: 'Collections' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Signal' },
] as const;

export const FOOTER_LINKS = [
  { href: '/#services', label: 'Support' },
  { href: '/#collections', label: 'Collections' },
  { href: '/#how', label: 'How it works' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/blog', label: 'Signal' },
  { href: '/#contact', label: 'Contact' },
] as const;

export const CATEGORIES = ['Nearshore', 'Bilingual CX', 'Operations', 'Collections'] as const;
export type Category = (typeof CATEGORIES)[number];
