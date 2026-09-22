/**
 * EA Fit Quiz — locked questions, scoring, and on-screen gifts.
 * Question copy is locked (ea-quiz-brief). Do not reopen.
 *
 * PDF-by-email is stubbed: FormSubmit notifies sales; the visitor gets
 * the 7-day plan + scorecard on screen (and can print/save as PDF).
 */

export type RoleId = 'founder' | 'revenue' | 'ops' | 'other';
export type ScopeId = 'sales' | 'marketing' | 'exec' | 'personal';
export type HoursId = 'same' | 'partial' | 'async';
export type PriorId = 'failed' | 'plateaued' | 'never' | 'cheap';
export type SeverityId = 'lt5' | '5-10' | '10-15' | '15+';
export type BilingualId = 'required' | 'nice' | 'en-only';
export type OwnershipId = 'yes' | 'playbook' | 'no';
export type TimingId = 'month' | 'soon' | 'later' | 'research';

export type QuestionId =
  | 'role'
  | 'scope'
  | 'hours'
  | 'prior'
  | 'severity'
  | 'bilingual'
  | 'ownership'
  | 'timing';

export type Band = 'diy' | 'burned' | 'ready' | 'task';

export interface QuizAnswers {
  role?: RoleId;
  scope?: ScopeId;
  hours?: HoursId;
  prior?: PriorId;
  severity?: SeverityId;
  bilingual?: BilingualId;
  ownership?: OwnershipId;
  timing?: TimingId;
}

export interface QuizOption {
  id: string;
  label: string;
}

export interface QuizQuestion {
  id: QuestionId;
  prompt: string;
  hint?: string;
  options: QuizOption[];
}

export const ROLE_PARAM_MAP: Record<string, RoleId> = {
  founder: 'founder',
  ceo: 'founder',
  revenue: 'revenue',
  sales: 'revenue',
  agency: 'revenue',
  ops: 'ops',
  coo: 'ops',
  cos: 'ops',
  other: 'other',
};

export const ROLE_LABELS: Record<RoleId, string> = {
  founder: 'Founder / CEO',
  revenue: 'Revenue / sales / agency leader',
  ops: 'Ops / COO / business manager',
  other: 'Other',
};

export const HDYHAU_OPTIONS = [
  'Bing',
  'Google',
  'Podcast',
  'Referral',
  'LinkedIn',
  'Twitter/X',
  'Facebook',
  'Instagram',
  'Youtube',
  'Newsletter',
  'Blog or Publication',
  'Events',
  'Tiktok',
  'Other',
  'Reddit',
  'Physical Mail',
  'KOL',
  'Partnership',
  'ChatGPT',
] as const;

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 'role',
    prompt: 'Which seat is closest to yours?',
    hint: 'We match bilingual business EAs — not personal-admin gigs.',
    options: [
      { id: 'founder', label: 'Founder / CEO' },
      { id: 'revenue', label: 'Revenue / sales / agency leader' },
      { id: 'ops', label: 'Ops / COO / business manager for an exec' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'scope',
    prompt: 'What should a dedicated EA own first?',
    hint: 'Pick the work that would actually give you the week back.',
    options: [
      { id: 'sales', label: 'Sales support, follow-ups, CRM hygiene, meeting facilitation' },
      { id: 'marketing', label: 'Marketing / PM / team coordination' },
      { id: 'exec', label: 'Executive ops (inbox, calendar, vendors) for the business' },
      { id: 'personal', label: 'Mostly personal errands / household' },
    ],
  },
  {
    id: 'hours',
    prompt: 'When does support need to work?',
    hint: 'Our EAs overlap U.S. business hours. Overnight queues are a different product.',
    options: [
      { id: 'same', label: 'Same hours as my U.S. team (overlap required)' },
      { id: 'partial', label: 'Partial overlap is fine' },
      { id: 'async', label: 'Overnight / async is fine' },
    ],
  },
  {
    id: 'prior',
    prompt: 'Have you hired a VA or offshore assistant before?',
    options: [
      { id: 'failed', label: 'Yes — quality or timezone failed; still need real ownership' },
      { id: 'plateaued', label: 'Yes — worked OK but plateaued / turnover' },
      { id: 'never', label: 'Not yet — ready to do it right the first time' },
      { id: 'cheap', label: 'Just exploring cheap task help' },
    ],
  },
  {
    id: 'severity',
    prompt: 'Hours per week you spend on inbox, calendar, and follow-ups?',
    hint: 'Severity informs the plan. It does not decide fit by itself.',
    options: [
      { id: 'lt5', label: 'Under 5 hours' },
      { id: '5-10', label: '5–10 hours' },
      { id: '10-15', label: '10–15 hours' },
      { id: '15+', label: '15+ hours' },
    ],
  },
  {
    id: 'bilingual',
    prompt: 'Do you need bilingual English / Spanish?',
    hint: 'Vendors, stakeholders, U.S.–LatAm ops, dual-language teams — not family-first.',
    options: [
      { id: 'required', label: 'Required' },
      { id: 'nice', label: 'Nice-to-have' },
      { id: 'en-only', label: 'English-only is fine' },
    ],
  },
  {
    id: 'ownership',
    prompt: 'To get ROI at ~$3k/mo, will you stay close for the first few weeks the seat is live?',
    hint: 'A dedicated seat only pays back if you treat it like hiring a key person.',
    options: [
      { id: 'yes', label: 'Yes — treat like hiring a key seat' },
      { id: 'playbook', label: 'Somewhat — need a playbook so it’s not all on me' },
      { id: 'no', label: 'No — need someone who figures it out with almost no input' },
    ],
  },
  {
    id: 'timing',
    prompt: 'When do you want a dedicated EA in the seat?',
    options: [
      { id: 'month', label: 'This month' },
      { id: 'soon', label: '30–60 days' },
      { id: 'later', label: '90+ days' },
      { id: 'research', label: 'Just researching' },
    ],
  },
];

export function parseRoleParam(raw: string | null | undefined): RoleId | undefined {
  if (!raw) return undefined;
  return ROLE_PARAM_MAP[raw.trim().toLowerCase()];
}

export function isComplete(answers: QuizAnswers): answers is Required<QuizAnswers> {
  return QUESTIONS.every((q) => Boolean(answers[q.id]));
}

/**
 * Soft-DQ → silent Task-shopper. Burned priors win over Ready.
 * First-timers with near-term timing → Ready. Slower first-timers → DIY.
 */
export function scoreQuiz(answers: QuizAnswers): Band {
  if (
    answers.scope === 'personal' ||
    answers.hours === 'async' ||
    answers.prior === 'cheap' ||
    answers.ownership === 'no'
  ) {
    return 'task';
  }

  if (answers.prior === 'failed' || answers.prior === 'plateaued') {
    return 'burned';
  }

  const urgent = answers.timing === 'month' || answers.timing === 'soon';
  if (urgent) return 'ready';
  return 'diy';
}

export function optionLabel(questionId: QuestionId, optionId: string | undefined): string {
  const q = QUESTIONS.find((item) => item.id === questionId);
  return q?.options.find((o) => o.id === optionId)?.label ?? '';
}

export function matchCount(answers: QuizAnswers): 3 | 4 | 5 {
  let n = 5;
  if (answers.bilingual === 'required') n -= 1;
  if (answers.hours === 'same') n -= 1;
  if (n < 3) return 3;
  if (n > 5) return 5;
  return n as 3 | 4 | 5;
}

export function matchProfile(answers: QuizAnswers): string {
  if (answers.scope === 'sales' || answers.role === 'revenue') {
    return 'revenue-desk bilingual EAs who own follow-ups, CRM hygiene, and meeting facilitation';
  }
  if (answers.scope === 'marketing') {
    return 'coordination bilingual EAs who can run PM, marketing ops, and team facilitation';
  }
  if (answers.role === 'ops') {
    return 'ops-minded bilingual EAs who already live in inbox, calendar, and vendor work';
  }
  return 'founder-ops bilingual EAs who will take inbox, calendar, and follow-through — not a ticket queue';
}

export interface BandCopy {
  id: Band;
  name: string;
  kicker: string;
  diagnosis: string;
  barrier: string;
  next: string;
  cta: string;
  silent: boolean;
}

function taskDiagnosis(answers: QuizAnswers): string {
  if (answers.scope === 'personal') {
    return 'A dedicated business EA is the wrong product for household- or errands-first work. That’s task help, not an executive seat.';
  }
  if (answers.hours === 'async') {
    return 'Overnight / async coverage is a task-VA pattern. Teleforce EAs work U.S. hours, in real time — not an overnight queue.';
  }
  if (answers.prior === 'cheap') {
    return 'You’re shopping cheap task help. That’s a different market than a dedicated ~$3k bilingual nearshore EA.';
  }
  if (answers.ownership === 'no') {
    return 'A dedicated seat only pays back if you show up for it. Going live is about 2–3 hours of your time — then you and your EA run the day-to-day.';
  }
  return 'A dedicated EA seat would be overkill for how you want help right now.';
}

export function bandCopy(answers: QuizAnswers, band: Band): BandCopy {
  if (band === 'task') {
    return {
      id: 'task',
      name: 'Task help is still the better move',
      kicker: 'Honest read',
      diagnosis: taskDiagnosis(answers),
      barrier:
        'Forcing a dedicated EA here wastes money. Keep a tighter task setup until you want ownership on U.S. hours.',
      next: 'Use the scorecard and 7-day plan as a tighter brief for whatever help you keep. When you want a real seat, come back.',
      cta: 'Send my plan + scorecard',
      silent: true,
    };
  }

  if (band === 'burned') {
    return {
      id: 'burned',
      name: 'Burned by Offshore / Stuck After VAs',
      kicker: 'Hottest fix',
      diagnosis:
        'You’ve already paid for help. Quality, timezone, or ownership failed — or it worked until turnover flattened it. You don’t need another freelancer audition.',
      barrier:
        'The next hire can’t be a task queue in the wrong hours. You need bilingual EN/ES, U.S. overlap, and someone who owns the work.',
      next: 'Priority match. Onboarding → Select your EA → Kickoff. You pick from one to two candidates. You and your EA run the day-to-day — your partnership manager stays on with full back-end support.',
      cta: 'Book a priority match',
      silent: false,
    };
  }

  if (band === 'ready') {
    return {
      id: 'ready',
      name: 'Ready for a Dedicated Nearshore EA',
      kicker: 'Fit',
      diagnosis:
        'Scope is business ops, hours need to overlap, and you’re willing to onboard. That’s the bar for a dedicated bilingual LatAm EA on U.S. hours.',
      barrier:
        'Waiting. Every week without a seat, you’re still the follow-up bottleneck.',
      next: 'Book a match. Top-tier bilingual EN/ES, LatAm nearshore, U.S. hours. Onboarding → Select your EA → Kickoff. You pick from one to two candidates. You and your EA run the day-to-day, with full back-end support behind the seat.',
      cta: 'Book your match',
      silent: false,
    };
  }

  return {
    id: 'diy',
    name: 'DIY Operator',
    kicker: 'Outgrowing solo',
    diagnosis:
      'You’re carrying inbox, calendar, and follow-ups yourself — and you’ve never handed that ownership to a dedicated EA. Task help won’t fix a seat-shaped hole.',
    barrier:
      'The trap is “I’ll just do it myself” until the week is gone. A seat only works if you treat onboarding like a hire, not a dump.',
    next: 'Use the 7-day handoff plan to see what the first week actually looks like. When you’re ready to install a seat — not audition freelancers — book a match.',
    cta: 'Book a match when you’re ready',
    silent: false,
  };
}

export interface PlanDay {
  day: string;
  title: string;
  body: string;
}

function roleSops(role: RoleId | undefined, scope: ScopeId | undefined): [PlanDay, PlanDay] {
  if (scope === 'sales' || role === 'revenue') {
    return [
      {
        day: 'Day 4',
        title: 'SOP — follow-ups',
        body: 'Write the rule: who gets a same-day bump, what “qualified” means, and where it lands in the CRM. Your EA owns the chase; you own the decision.',
      },
      {
        day: 'Day 5',
        title: 'SOP — meeting facilitation',
        body: 'Agenda template, pre-read, notes, and next-action owner. If a meeting ends without a written follow-up, the SOP failed — not the EA.',
      },
    ];
  }
  if (scope === 'marketing' || role === 'ops') {
    return [
      {
        day: 'Day 4',
        title: 'SOP — team coordination',
        body: 'Name the recurring rituals (standup, status, blocker chase). Your EA runs the cadence and surfaces only what needs you.',
      },
      {
        day: 'Day 5',
        title: 'SOP — project hygiene',
        body: 'One source of truth, one update format, one definition of done. Stop collecting status in your head.',
      },
    ];
  }
  return [
    {
      day: 'Day 4',
      title: 'SOP — inbox rules',
      body: 'Three folders or labels: Act (you), Handle (EA), Park. Response-time norms. VIP list. If it can be answered from a doc, it shouldn’t hit you.',
    },
    {
      day: 'Day 5',
      title: 'SOP — calendar norms',
      body: 'Hold blocks, travel buffers, “no meeting” windows, and who can put time on your calendar. Your EA protects the week; you stop playing Tetris.',
    },
  ];
}

export function handoffPlan(answers: QuizAnswers, band: Band): PlanDay[] {
  const [sopA, sopB] = roleSops(answers.role, answers.scope);
  const burnedNote =
    band === 'burned'
      ? ' Write it down this time — verbal “just handle it” is how the last VA stalled.'
      : '';
  const hoursNote =
    answers.hours === 'same'
      ? ' Same-hours overlap is the point: live questions, not an overnight pile.'
      : ' Agree the overlap window in writing so work doesn’t drift async.';

  return [
    {
      day: 'Day 1',
      title: 'Access + the real job',
      body:
        (band === 'task'
          ? 'If you stay with task help: list the 5 recurring jobs (not a junk drawer of errands). If you later hire a seat, bring this list to the onboarding call.'
          : 'Grant tools (email, calendar, CRM, Slack). Record a 20-minute walkthrough of a normal day. Name the 3 outcomes you want owned in week one — not 40 tasks.') +
        burnedNote,
    },
    {
      day: 'Day 2',
      title: 'Inbox + calendar norms',
      body: `Decide what “done” looks like on the two surfaces that eat your week. Your EA (or a tighter VA brief) should know VIP senders, meeting types, and what never gets declined without you.${hoursNote}`,
    },
    {
      day: 'Day 3',
      title: 'Communication cadence',
      body:
        answers.ownership === 'playbook'
          ? 'Use a daily stand-up (15 min) plus a written end-of-day. The playbook is the product this week — don’t skip it because you’re busy.'
          : 'Pick one channel for live work and one for async recap. You should not be re-explaining context in three tools.',
    },
    sopA,
    sopB,
    {
      day: 'Day 6',
      title: 'Live work, not shadowing forever',
      body:
        band === 'diy'
          ? 'Hand one live workflow (a real inbox hour or a real follow-up list). Watch once. Then get out of the way. DIY operators fail here by hovering.'
          : 'Run one live cycle on a real workflow. You review exceptions only. If you re-do the work, the handoff didn’t happen.',
    },
    {
      day: 'Day 7',
      title: 'Lock the weekly rhythm',
      body: 'Score the week: what moved without you, what bounced back, what SOP is missing. Keep, kill, or rewrite one rule. That’s how a seat compounds — not a longer task list.',
    },
  ];
}

export interface ScoreRow {
  keep: string;
  handoff: string;
  later: string;
}

export function scorecard(answers: QuizAnswers): ScoreRow[] {
  const role = answers.role;
  const scope = answers.scope;

  if (scope === 'sales' || role === 'revenue') {
    return [
      { keep: 'Pricing, discounts, and deal strategy', handoff: 'CRM hygiene and stage updates', later: 'Light list-building support' },
      { keep: 'Closing conversations', handoff: 'Follow-up bumps and recap emails', later: 'Inbound qualification scripts' },
      { keep: 'Offer design', handoff: 'Meeting setup, agendas, notes', later: 'Vendor research for the stack' },
      { keep: 'Final yes/no on accounts', handoff: 'Calendar holds around selling time', later: 'Reporting snapshot each Friday' },
    ];
  }
  if (scope === 'marketing') {
    return [
      { keep: 'Positioning and final creative calls', handoff: 'Project tracker and deadline chase', later: 'Light asset production coord' },
      { keep: 'Budget approval', handoff: 'Standups and blocker lists', later: 'Vendor scheduling' },
      { keep: 'External spokespeople', handoff: 'Recurring status to the team', later: 'Doc hygiene / naming' },
      { keep: 'Hiring for the function', handoff: 'Calendar + prep for working sessions', later: 'Simple reporting' },
    ];
  }
  if (role === 'ops') {
    return [
      { keep: 'Policy and exception calls', handoff: 'Inbox triage for the exec you support', later: 'Travel once norms exist' },
      { keep: 'Org design decisions', handoff: 'Vendor follow-ups and renewals', later: 'Process docs you already run' },
      { keep: 'Cross-functional tradeoffs', handoff: 'Calendar and meeting prep', later: 'Light research briefs' },
      { keep: 'Final stakeholder comms', handoff: 'Action-item chase after meetings', later: 'Tool admin' },
    ];
  }
  return [
    { keep: 'Strategy, fundraising, and people decisions', handoff: 'Inbox triage and draft replies', later: 'Travel and expenses' },
    { keep: 'Customer-critical judgment calls', handoff: 'Calendar ownership and prep', later: 'Vendor shopping once SOPs exist' },
    { keep: 'External company voice (final)', handoff: 'Follow-ups you keep dropping', later: 'Personal admin in the background' },
    { keep: 'Hiring for leadership seats', handoff: 'Meeting notes → owners → dates', later: 'Research briefs' },
  ];
}

export interface TeardownRow {
  label: string;
  va: string;
  ea: string;
}

export function teardown(answers: QuizAnswers, band: Band): TeardownRow[] {
  const hours =
    answers.hours === 'async'
      ? {
          label: 'Hours',
          va: 'Overnight / async is normal — you wake up to a pile.',
          ea: 'U.S. overlap. Live questions. No next-morning lag on calendar or follow-ups.',
        }
      : {
          label: 'Hours',
          va: 'Often a different timezone sold as “24/7 coverage.”',
          ea: 'LatAm nearshore on your U.S. clock — real-time, not a queue.',
        };

  const own =
    answers.ownership === 'no'
      ? {
          label: 'Onboarding',
          va: 'You want zero input. That’s how work stays shallow.',
          ea: 'About 2–3 hours of your time to go live: Onboarding → Select your EA → Kickoff. You pick from one to two candidates. Then you and your EA run the day-to-day, with back-end support behind the seat.',
        }
      : {
          label: 'Ownership',
          va: 'Tickets and task lists. You remain the project manager.',
          ea: 'A dedicated person owns inbox, calendar, and follow-through.',
        };

  const prior =
    band === 'burned' || answers.prior === 'failed'
      ? {
          label: 'Why the last setup failed',
          va: 'Quality, timezone, or turnover. You paid for hours, not a seat.',
          ea: 'Employed, rematched if needed, bilingual EN/ES, screened for ownership.',
        }
      : answers.prior === 'plateaued'
        ? {
            label: 'The plateau',
            va: 'Fine until they churned or couldn’t take the next layer.',
            ea: 'Career EA + a success lead if the fit slips — not a new Upwork search.',
          }
        : {
            label: 'What you’re buying',
            va: 'Flexible hours and a junk drawer of tasks.',
            ea: 'One dedicated bilingual seat. Business ops first. Not household-as-the-product.',
          };

  const scope =
    answers.scope === 'personal'
      ? {
          label: 'Scope',
          va: 'Errands and household — a valid gig, wrong Teleforce SKU.',
          ea: 'Business EA: inbox, calendar, sales support, PM, team coordination.',
        }
      : {
          label: 'Scope',
          va: 'Whatever fits in a ticket.',
          ea: 'Named workflows. Written SOPs. You stop re-explaining every Monday.',
        };

  return [hours, own, prior, scope];
}

export function hoursLabel(id: SeverityId | undefined): string {
  switch (id) {
    case 'lt5':
      return 'under 5 hours / week';
    case '5-10':
      return '5–10 hours / week';
    case '10-15':
      return '10–15 hours / week';
    case '15+':
      return '15+ hours / week';
    default:
      return 'unspecified hours';
  }
}

export function summarizeAnswers(answers: QuizAnswers): string {
  return QUESTIONS.map((q) => `${q.prompt} → ${optionLabel(q.id, answers[q.id]) || '(blank)'}`).join('\n');
}

export function bookable(band: Band): boolean {
  return band === 'ready' || band === 'burned' || band === 'diy';
}

export function requiresEnrichment(band: Band): boolean {
  return band === 'ready' || band === 'burned';
}
