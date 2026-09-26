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

export default function BillingInfo({
  init,
  persist = false,
  hasCard = true,
}: {
  init: BillingInit;
  persist?: boolean;
  hasCard?: boolean;
}) {
  const [form, setForm] = useState({
    contactName: init.contactName,
    company: init.company,
    email: init.email,
    address: init.address,
  });
  const [status, setStatus] = useState<'idle' | 'working' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: e.target.value }));
    setStatus('idle');
    setMessage('');
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setMessage('');
    if (!persist) {
      window.setTimeout(() => {
        setStatus('saved');
        setMessage('Billing information updated.');
      }, 500);
      return;
    }

    try {
      const res = await fetch('/api/account/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Could not save billing information.');
        return;
      }
      setStatus('saved');
      setMessage('Billing information updated.');
    } catch {
      setStatus('error');
      setMessage('Could not save billing information.');
    }
  }

  const last4 = init.cardLast4 || '••••';

  return (
    <form onSubmit={save}>
      <div className="field" id="add-payment">
        <label>Payment method</label>
        {hasCard ? (
          <>
            <div className="cardline">
              <span className="cardbrand">{init.cardBrand || 'Card'}</span>
              <span className="mono">···· ···· ···· {last4}</span>
              <span className="badge" style={{ marginLeft: 'auto' }}>On file</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
              Saved with Stripe. Nothing is charged until your EA starts. To replace the card,
              your account manager sends a secure link — it is not typed here.
            </p>
          </>
        ) : (
          <>
            <div className="cardline">
              <span className="cardbrand">No card on file</span>
              <span className="badge" style={{ marginLeft: 'auto' }}>Add before kickoff</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
              Nothing is charged now. Add a card before kickoff when we follow up.
              This page does not collect a card number.
            </p>
          </>
        )}
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
      {message && (
        <div className={`note ${status === 'error' ? 'err' : 'ok'}`} role="status">
          {message}
        </div>
      )}
    </form>
  );
}
