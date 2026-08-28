// Rich, conversion-focused PPC landing pages — one per featured service.
// Top-level slugs (e.g. /customer-service), long-form and persuasive, with a
// booking-oriented CTA. Separate from the content /services/<slug> pages.
export interface Landing {
  slug: string; // ties to SERVICES + the deeper /services/<slug> page
  metaTitle: string;
  metaDesc: string;
  img: string;
  cat: string;
  h1: string;
  sub: string;
  bullets: { h: string; p: string }[];
  problem: { h: string; p: string; points: string[] };
  solution: { h: string; p: string };
  outcomes: string[]; // "the result" — quick wins
  formHeading: string;
  subject: string;
}

export const LANDINGS: Landing[] = [
  {
    slug: 'customer-service',
    metaTitle: 'Bilingual Customer Service Outsourcing | Teleforce',
    metaDesc:
      'Bilingual nearshore customer service on U.S. hours — native English/Spanish agents trained on your brand, at less than half the in-house cost. Book a call.',
    img: '/brand/image7.jpg',
    cat: 'Bilingual customer service',
    h1: 'Bilingual customer service that sounds like your brand.',
    sub: 'Native English and Spanish agents on U.S. hours, trained on your product — so every customer gets an in-house-quality answer, in their language, at less than half the loaded cost.',
    bullets: [
      { h: 'One seat, two languages', p: 'Native English and Spanish from the same agent — no language routing, no two-tier experience for your Spanish-speaking customers.' },
      { h: 'On your clock', p: 'Full U.S.-business-hours overlap. Real-time chat and escalations, not an overnight queue that churns a customer before anyone replies.' },
      { h: 'Less than half the loaded cost', p: 'Skip the recruiting, benefits, tools, and idle capacity of a U.S. hire — for a fraction of the total cost, with none of the ramp.' },
    ],
    problem: {
      h: 'Great support is expensive to staff — and easy to get wrong.',
      p: 'Hiring in-house means recruiting, benefits, tools, and idle capacity you pay for whether the phones ring or not. Going far-offshore trades that cost for a time-zone gap and an accent your customers notice. Either way, your Spanish-speaking customers quietly get a second-class experience.',
      points: [
        'A U.S. agent costs 2–3× their salary once you load benefits, tools, and management',
        'Far-offshore teams answer on a 10–12 hour lag — escalations wait overnight',
        'English-only support silently churns the customers who prefer Spanish',
      ],
    },
    solution: {
      h: 'A trained bilingual team, in your time zone.',
      p: 'Teleforce staffs native English/Spanish agents who work as an extension of your brand — trained on your product, your tone, and your tools, on U.S. hours. You get in-house-quality support without the in-house cost, ramp, or management overhead.',
    },
    outcomes: [
      'Higher CSAT across both English and Spanish customers',
      'Faster first-response and resolution times',
      'Support cost cut by more than half vs. U.S. in-house',
    ],
    formHeading: 'Scope your bilingual support team.',
    subject: 'New Teleforce proposal — Customer Service',
  },
  {
    slug: 'data-entry',
    metaTitle: 'Data Entry Outsourcing | Nearshore Back Office | Teleforce',
    metaDesc:
      'Accurate nearshore data entry and back-office work — order entry, CRM hygiene, document processing — by a managed bilingual team with QA built in. Book a call.',
    img: '/brand/image3.jpg',
    cat: 'Data entry & back office',
    h1: 'Accurate back-office data work, off your plate.',
    sub: 'Order entry, CRM hygiene, and document processing handled by a managed bilingual team — with QA and double-key verification — so your people stop spending nights in spreadsheets.',
    bullets: [
      { h: 'Accuracy built in', p: 'QA and double-key verification on every batch — clean data you can actually trust in your systems and reports.' },
      { h: 'Scales with your volume', p: 'Surge for peaks, dial back for lulls. You pay for the output, not for idle seats sitting between busy periods.' },
      { h: 'Inside your tools', p: 'Order, claim, and form entry, CRM de-duplication, and document digitization — right in the systems you already run.' },
    ],
    problem: {
      h: 'Your team is drowning in data work that isn’t their job.',
      p: 'Order entry, CRM cleanup, and document processing eat nights and weekends — or they pile up until the data is too dirty to trust. Hiring dedicated in-house staff for it is overkill; letting it slide is expensive in errors and stalled reporting.',
      points: [
        'Skilled, well-paid staff spending hours keying and cleaning records',
        'Dirty CRM data breaking reporting, routing, and outreach',
        'Backlogs that grow faster than you can clear them',
      ],
    },
    solution: {
      h: 'A managed team that keeps your data clean.',
      p: 'Teleforce runs a dedicated bilingual team that handles the entry, cleanup, and processing accurately — with QA and double-key verification — inside your existing tools, scaling up and down with your volume so you never pay for idle time.',
    },
    outcomes: [
      'Clean, current data your systems can rely on',
      'Backlogs cleared and kept clear',
      'Your in-house team back on higher-value work',
    ],
    formHeading: 'Hand off your data work.',
    subject: 'New Teleforce proposal — Data Entry',
  },
  {
    slug: 'appointment-setting',
    metaTitle: 'Appointment Setting Services | Bilingual | Teleforce',
    metaDesc:
      'Bilingual appointment setting — qualify, book, and confirm the right prospects, with reminders that cut no-shows. Nearshore, on U.S. hours. Book a call.',
    img: '/brand/image9.jpg',
    cat: 'Appointment setting',
    h1: 'A fuller calendar — and fewer no-shows.',
    sub: 'Bilingual reps qualify, book, and confirm — filling your calendar with the right prospects and reminding them so they actually show up, in English or Spanish.',
    bullets: [
      { h: 'Qualified, not just booked', p: 'Reps qualify against your criteria before they schedule, so your team’s time goes to real opportunities — not tire-kickers.' },
      { h: 'Fewer no-shows', p: 'Confirmations and reminders in English or Spanish keep booked slots from quietly evaporating before the meeting.' },
      { h: 'Inbound and outbound', p: 'We work the leads you have and reach out to new ones — integrated with your calendar and CRM so nothing slips.' },
    ],
    problem: {
      h: 'An empty calendar and a pile of no-shows.',
      p: 'Your closers need meetings, not prospecting — and the meetings you do book evaporate when no one confirms them. Doing it in-house pulls your sellers off selling and burns them out on the phones.',
      points: [
        'Reps prospecting and dialing instead of closing',
        'Unqualified bookings clogging the calendar',
        'No-shows quietly killing your show-rate and forecast',
      ],
    },
    solution: {
      h: 'Booked, confirmed, qualified meetings.',
      p: 'Teleforce reps run inbound and outbound scheduling end to end — qualifying, booking, and confirming in English or Spanish, integrated with your calendar and CRM. Your team walks into meetings that are worth their time.',
    },
    outcomes: [
      'A calendar full of qualified prospects',
      'A measurably higher show-rate',
      'Sellers focused on closing, not scheduling',
    ],
    formHeading: 'Fill your calendar.',
    subject: 'New Teleforce proposal — Appointment Setting',
  },
  {
    slug: 'sales-lead-generation',
    metaTitle: 'Sales Lead Generation Outsourcing | Bilingual | Teleforce',
    metaDesc:
      'Bilingual top-of-funnel lead generation — prospecting, list building, and qualification that feeds your closers qualified leads. Nearshore. Book a call.',
    img: '/brand/image6.jpg',
    cat: 'Sales lead generation',
    h1: 'A bilingual top-of-funnel engine for your sales team.',
    sub: 'Prospecting, list building, and lead qualification that feeds your closers a steady stream of qualified, bilingual-ready leads — including the Hispanic market an English-only team can’t reach.',
    bullets: [
      { h: 'Qualified conversations', p: 'Lead qualification and scoring before handoff — your AEs work opportunities, not raw lists someone still has to sort.' },
      { h: 'Reach the Hispanic market', p: 'Native-Spanish outreach opens U.S. and Latin American buyers an English-only team consistently underperforms on.' },
      { h: 'Clean CRM, warm handoffs', p: 'Targeted list building and enrichment in your CRM, with warm handoffs or booked appointments for your closers.' },
    ],
    problem: {
      h: 'Pipeline dries up at the top of the funnel.',
      p: 'Not enough qualified conversations enter each week, so your AEs prospect their own pipeline instead of closing. Building an in-house SDR bench to fix it is slow, expensive, and churns before it pays off.',
      points: [
        'AEs trading selling time for list-building and cold outreach',
        'A thin, unqualified top of funnel',
        'A Spanish-speaking market you’re leaving on the table',
      ],
    },
    solution: {
      h: 'A steady stream of qualified leads.',
      p: 'Teleforce runs your top of funnel — targeted lists, CRM enrichment, personalized outreach, and qualification against your criteria — and hands your closers qualified, bilingual-ready conversations, not raw leads that still need sorting.',
    },
    outcomes: [
      'A predictable flow of qualified conversations',
      'AEs focused on closing, not prospecting',
      'A whole buyer segment your competitors miss',
    ],
    formHeading: 'Feed your pipeline.',
    subject: 'New Teleforce proposal — Sales Lead Gen',
  },
  {
    slug: 'sdr-bdr',
    metaTitle: 'Outsourced SDR / BDR Teams | Nearshore Bilingual | Teleforce',
    metaDesc:
      'Dedicated bilingual SDR/BDR teams that own outbound and book qualified meetings — at a fraction of a U.S. in-house rep, faster ramp. Book a call.',
    img: '/brand/image7.jpg',
    cat: 'SDR / BDR teams',
    h1: 'Dedicated SDRs and BDRs who book qualified meetings.',
    sub: 'Bilingual nearshore reps who own your outbound — prospecting, sequencing, calling, and qualifying — and hand your closers booked, sales-ready meetings, at a fraction of a U.S. in-house rep.',
    bullets: [
      { h: 'Dedicated reps, ramped on your pitch', p: 'Named reps trained on your ICP and talk-track — an outbound engine that lives in your pipeline, not a shared pool.' },
      { h: 'Meetings, not just activity', p: 'Multi-touch sequences across call, email, and LinkedIn that end in confirmed meetings on your closers’ calendars.' },
      { h: 'A fraction of a U.S. SDR', p: 'Faster ramp and far less loaded cost than hiring in-house — and you scale up or down as targets shift.' },
    ],
    problem: {
      h: 'Outbound that never gets off the ground.',
      p: 'A U.S. SDR takes months to ramp, costs six figures once loaded, and churns once trained. So outbound stalls, pipeline with it, and every departure erases the ramp you just paid for.',
      points: [
        'Months-long ramp on every new rep you hire',
        'Six-figure fully-loaded cost per SDR',
        'High turnover erasing the training investment',
      ],
    },
    solution: {
      h: 'A ready-made outbound engine.',
      p: 'Teleforce gives you dedicated, bilingual SDRs and BDRs who own the full motion — prospecting, sequencing, calling, and qualifying — and hand your closers booked, sales-ready meetings. Ramped fast, because the recruiting and training already exist.',
    },
    outcomes: [
      'Confirmed meetings on your closers’ calendars',
      'Outbound live in weeks, not quarters',
      'Pipeline that scales without a hiring sprint',
    ],
    formHeading: 'Build your SDR team.',
    subject: 'New Teleforce proposal — SDR / BDR',
  },
];
