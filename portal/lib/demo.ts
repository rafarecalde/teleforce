// Sample data for the client-facing preview. When this portal is wired to real
// billing later, replace these with data read from your source of truth — the
// section components don't need to change.

export type DemoPlan = {
  id: string;
  eaName: string;
  term: '3' | '12';
  rate: string; // current monthly rate
  rate12: string; // 12-month rate (for the "switch" offer)
  monthlySavings: string;
  annualSavings: string;
  serviceStart: string;
  commitmentEnd: string;
};

export const DEMO = {
  accountEmailNote: 'demo account',
  plans: [
    {
      id: 'sub_demo_1',
      eaName: 'María González',
      term: '3',
      rate: '$3,000',
      rate12: '$2,700',
      monthlySavings: '$300',
      annualSavings: '$3,600',
      serviceStart: 'March 3, 2026',
      commitmentEnd: 'June 3, 2026',
    } satisfies DemoPlan,
  ] as DemoPlan[],
  billing: {
    contactName: 'Ana Rivera',
    company: 'Northwind Studios',
    email: 'billing@northwind.example',
    address: '500 Market St, Suite 400, San Francisco, CA 94105',
    cardBrand: 'Visa',
    cardLast4: '4242',
  },
};
