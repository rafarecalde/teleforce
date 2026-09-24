'use client';

import { useState } from 'react';

export type BillingInit = {
  contactName: string;
  company: string;
  email: string;
  address: string;
  cardBrand: string;
  cardLast4: string;
};

export default function BillingInfo({ init }: { init: BillingInit }) {
  const [form, setForm] = useState({
    contactName: init.contactName,
    company: init.company,
    email: init.email,
    address: init.address,
  });
  const [status, setStatus] = useState<'idle' | 'working' | 'saved'>('idle');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setStatus('idle');
  };

  function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setTimeout(() => setStatus('saved'), 500);
  }

  return (
    <form onSubmit={save}>
      {/* Card on file — read-only. Secure card collection is handled by the
          payment processor at kickoff; never typed into this form. */}
      <div className="field">
        <label>Payment method</label>
        <div className="cardline">
          <span className="cardbrand">{init.cardBrand}</span>
          <span className="mono">···· ···· ···· {init.cardLast4}</span>
          <span className="badge" style={{ marginLeft: 'auto' }}>On file</span>
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          Your card is stored securely with our payment processor. To update it, your account
          manager sends a secure link — it&apos;s never entered here.
        </p>
      </div>

      <hr className="divider" />

      <div className="grid2">
        <div className="field">
          <label htmlFor="b-contact">Billing contact</label>
          <input id="b-contact" value={form.contactName} onChange={set('contactName')} />
        </div>
        <div className="field">
          <label htmlFor="b-company">Company</label>
          <input id="b-company" value={form.company} onChange={set('company')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="b-email">Billing email</label>
        <input id="b-email" type="email" value={form.email} onChange={set('email')} />
      </div>
      <div className="field">
        <label htmlFor="b-address">Billing address</label>
        <textarea id="b-address" value={form.address} onChange={set('address')} />
      </div>

      <button className="btn btn-primary" type="submit" disabled={status === 'working'}>
        {status === 'working' ? 'Saving…' : 'Save billing info'}
      </button>
      {status === 'saved' && (
        <div className="note ok" role="status">
          Billing information updated.
        </div>
      )}
    </form>
  );
}
