export const EA_FOCUS = [
  { value: 'inbox-calendar', label: 'Inbox, calendar, and scheduling' },
  { value: 'operations', label: 'Operations and follow-through' },
  { value: 'executive', label: 'Founder or executive support' },
  { value: 'sales', label: 'Sales and pipeline support' },
  { value: 'finance-admin', label: 'Finance and admin' },
  { value: 'mixed', label: 'A mix of the above' },
] as const;

export const EA_BILINGUAL = [
  { value: 'yes', label: 'Yes — English and Spanish' },
  { value: 'no', label: 'English is enough' },
  { value: 'either', label: 'Either works' },
] as const;

export const EA_START = [
  { value: 'asap', label: 'As soon as you can match someone' },
  { value: 'two-weeks', label: 'Within two weeks' },
  { value: 'month', label: 'Within a month' },
  { value: 'flexible', label: 'Timing is flexible' },
] as const;

export type FocusCode = (typeof EA_FOCUS)[number]['value'];
export type BilingualCode = (typeof EA_BILINGUAL)[number]['value'];
export type StartCode = (typeof EA_START)[number]['value'];

export const EA_SCHEDULE = 'full-time' as const;
