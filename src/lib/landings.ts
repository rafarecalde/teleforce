// Clean, conversion-focused landing pages — one per featured service.
// These live at top-level slugs (e.g. /customer-service) as standalone,
// ad-ready pages, separate from the content-rich /services/<slug> pages.
export interface Landing {
  slug: string; // ties to SERVICES + the deeper /services/<slug> page
  metaTitle: string;
  metaDesc: string;
  img: string;
  cat: string;
  h1: string;
  sub: string;
  bullets: { h: string; p: string }[];
  formHeading: string;
  subject: string;
}

export const LANDINGS: Landing[] = [
  {
    slug: 'customer-service',
    metaTitle: 'Bilingual Customer Service Outsourcing | Teleforce',
    metaDesc:
      'Bilingual nearshore customer service on U.S. hours — native English/Spanish agents trained on your brand, at less than half the in-house cost. Request a proposal.',
    img: '/brand/image8.jpg',
    cat: 'Bilingual customer service',
    h1: 'Bilingual customer service that sounds like your brand.',
    sub: 'Native English and Spanish agents on U.S. hours, trained on your product — so every customer gets an in-house-quality answer, in their language.',
    bullets: [
      { h: 'One seat, two languages', p: 'Native English and Spanish from the same agent — no language routing, no two-tier experience for your Spanish-speaking customers.' },
      { h: 'On your clock', p: 'Full U.S.-business-hours overlap. Real-time chat and escalations, not an overnight queue.' },
      { h: 'Less than half the loaded cost', p: 'Skip the recruiting, benefits, tools, and idle capacity of a U.S. hire — for a fraction of the total cost.' },
    ],
    formHeading: 'Scope your bilingual support team.',
    subject: 'New Teleforce proposal — Customer Service',
  },
  {
    slug: 'data-entry',
    metaTitle: 'Data Entry Outsourcing | Nearshore Back Office | Teleforce',
    metaDesc:
      'Accurate nearshore data entry and back-office work — order entry, CRM hygiene, document processing — by a managed bilingual team. Request a proposal.',
    img: '/brand/image3.jpg',
    cat: 'Data entry & back office',
    h1: 'Accurate back-office data work, off your plate.',
    sub: 'Order entry, CRM hygiene, and document processing handled by a managed bilingual team — so your people stop spending nights in spreadsheets.',
    bullets: [
      { h: 'Accuracy built in', p: 'QA and double-key verification on every batch — clean data you can trust in your systems.' },
      { h: 'Scales with your volume', p: 'Surge for peaks, dial back for lulls. You pay for the output, not idle seats.' },
      { h: 'Inside your tools', p: 'Order, claim, and form entry, CRM de-duplication, and document digitization — in the systems you already use.' },
    ],
    formHeading: 'Hand off your data work.',
    subject: 'New Teleforce proposal — Data Entry',
  },
  {
    slug: 'appointment-setting',
    metaTitle: 'Appointment Setting Services | Bilingual | Teleforce',
    metaDesc:
      'Bilingual appointment setting — qualify, book, and confirm the right prospects, with reminders that cut no-shows. Nearshore, on U.S. hours. Request a proposal.',
    img: '/brand/image9.jpg',
    cat: 'Appointment setting',
    h1: 'A fuller calendar — and fewer no-shows.',
    sub: 'Bilingual reps qualify, book, and confirm — filling your calendar with the right prospects and reminding them so they actually show up.',
    bullets: [
      { h: 'Qualified, not just booked', p: 'Reps qualify before they schedule, so your team’s time goes to real opportunities.' },
      { h: 'Fewer no-shows', p: 'Confirmations and reminders in English or Spanish keep booked slots from evaporating.' },
      { h: 'Inbound and outbound', p: 'We work your leads and reach out to new ones — integrated with your calendar and CRM.' },
    ],
    formHeading: 'Fill your calendar.',
    subject: 'New Teleforce proposal — Appointment Setting',
  },
  {
    slug: 'sales-lead-generation',
    metaTitle: 'Sales Lead Generation Outsourcing | Bilingual | Teleforce',
    metaDesc:
      'Bilingual top-of-funnel lead generation — prospecting, list building, and qualification that feeds your closers qualified leads. Nearshore. Request a proposal.',
    img: '/brand/image6.jpg',
    cat: 'Sales lead generation',
    h1: 'A bilingual top-of-funnel engine for your sales team.',
    sub: 'Prospecting, list building, and lead qualification that feeds your closers a steady stream of qualified, bilingual-ready leads.',
    bullets: [
      { h: 'Qualified conversations', p: 'Lead qualification and scoring before handoff — your AEs work opportunities, not raw lists.' },
      { h: 'Reach the Hispanic market', p: 'Native-Spanish outreach opens buyers an English-only team can’t reach.' },
      { h: 'Clean CRM, warm handoffs', p: 'List building and enrichment in your CRM, with warm handoffs or booked appointments for your closers.' },
    ],
    formHeading: 'Feed your pipeline.',
    subject: 'New Teleforce proposal — Sales Lead Gen',
  },
  {
    slug: 'sdr-bdr',
    metaTitle: 'Outsourced SDR / BDR Teams | Nearshore Bilingual | Teleforce',
    metaDesc:
      'Dedicated bilingual SDR/BDR teams that own outbound and book qualified meetings — at a fraction of a U.S. in-house rep, faster ramp. Request a proposal.',
    img: '/brand/image7.jpg',
    cat: 'SDR / BDR teams',
    h1: 'Dedicated SDRs and BDRs who book qualified meetings.',
    sub: 'Bilingual nearshore reps who own your outbound — prospecting, sequencing, calling, and qualifying — and hand your closers booked, sales-ready meetings.',
    bullets: [
      { h: 'Dedicated reps, ramped on your pitch', p: 'Named reps trained on your ICP and talk-track — an outbound engine that lives in your pipeline.' },
      { h: 'Meetings, not just activity', p: 'Multi-touch sequences across call, email, and LinkedIn that end in confirmed meetings on your closers’ calendars.' },
      { h: 'A fraction of a U.S. SDR', p: 'Faster ramp and far less loaded cost than hiring in-house — scale up or down as targets shift.' },
    ],
    formHeading: 'Build your SDR team.',
    subject: 'New Teleforce proposal — SDR / BDR',
  },
];
