'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EA_PAY_LINE, PAYMENT_STEP_COPY, SUBSCRIPTION_START_COPY } from '@/lib/constants';
import AddPaymentMethod from './AddPaymentMethod';

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
  accountEmail = '',
}: {
  init: BillingInit;
  persist?: boolean;
  hasCard?: boolean;
  accountEmail?: string;
}) {
  const router = useRouter();
  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string } | null>(
    hasCard ? { brand: init.cardBrand, last4: init.cardLast4 } : null,
  );
  const [form, setForm] = useState({
    contactName: init.contactName,
    company: init.company,
    email: init.email,
    address: init.address,
  });
  const [status, setStatus] = useState<'idle' | 'working' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (!changing) return;
    const previous = document.activeElement;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setChanging(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [changing]);

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

  const onFile = savedCard ?? (hasCard ? { brand: init.cardBrand, last4: init.cardLast4 } : null);
  const last4 = onFile?.last4 || '••••';

  return (
    <>
      <div className="field">
        <label>Payment method</label>
        {onFile ? (
          <div className="cardline">
            <span className="cardbrand">{onFile.brand || 'Card'}</span>
            <span className="mono">···· ···· ···· {last4}</span>
            <span className="badge" style={{ marginLeft: 'auto' }}>On file</span>
          </div>
        ) : (
          <div className="cardline">
            <span className="cardbrand">No card on file</span>
          </div>
        )}
        <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          {EA_PAY_LINE} {SUBSCRIPTION_START_COPY}
        </p>
        {persist && (
          <button className="btn btn-ghost pm-change" type="button" onClick={() => setChanging(true)}>
            Change payment method
          </button>
        )}
      </div>

      {persist && changing && (
        <div
          className="modal-back"
          onClick={(event) => {
            if (event.target === event.currentTarget) setChanging(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="change-pm-title">
            <div className="modal-head">
              <h3 id="change-pm-title">Change payment method</h3>
              <button className="modal-close" type="button" onClick={() => setChanging(false)}>
                Close
              </button>
            </div>
            <p className="pay-copy">{PAYMENT_STEP_COPY}</p>
            <AddPaymentMethod
              email={accountEmail || init.email}
              defaultName={init.contactName}
              onSaved={(card) => {
                setSavedCard(card);
                setChanging(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}

      <hr className="divider" />

      <form onSubmit={save}>
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
    </>
  );
}
