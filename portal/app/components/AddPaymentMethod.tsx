'use client';

import { useEffect, useRef, useState } from 'react';

type CardChange = { complete?: boolean; error?: { message?: string } };

type CardElement = {
  mount: (el: HTMLElement) => void;
  unmount: () => void;
  on: (event: 'change' | 'ready', handler: (event: CardChange) => void) => void;
};

type StripeClient = {
  elements: () => {
    create: (type: 'card', options: Record<string, unknown>) => CardElement;
  };
  confirmCardSetup: (
    clientSecret: string,
    data: {
      payment_method: {
        card: CardElement;
        billing_details: { name: string; email: string };
      };
    },
  ) => Promise<{ error?: { message?: string }; setupIntent?: { id?: string } }>;
};

type StripeFactory = (publishableKey: string) => StripeClient;

let stripeJs: Promise<void> | null = null;

function loadStripeJs(): Promise<void> {
  const host = window as Window & { Stripe?: StripeFactory };
  if (typeof host.Stripe === 'function') return Promise.resolve();
  if (!stripeJs) {
    stripeJs = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        stripeJs = null;
        reject(new Error('Could not load the secure card field.'));
      };
      document.head.appendChild(script);
    });
  }
  return stripeJs;
}

async function requestJson(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  let lastStatus = 0;
  let lastData: Record<string, unknown> = {};
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let res: Response;
    try {
      res = await fetch(path, init);
    } catch (err) {
      if (attempt === 0) continue;
      throw err;
    }
    lastStatus = res.status;
    lastData = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.ok || res.status !== 502 || attempt === 1) {
      return { ok: res.ok, status: res.status, data: lastData };
    }
  }
  return { ok: false, status: lastStatus, data: lastData };
}

async function postJson(path: string, body?: unknown): Promise<Record<string, unknown>> {
  const { ok, data } = await requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not save the card.');
  return data;
}

export default function AddPaymentMethod({
  email,
  defaultName,
  onSaved,
}: {
  email: string;
  defaultName: string;
  onSaved: (card: { brand: string; last4: string }) => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<StripeClient | null>(null);
  const cardRef = useRef<CardElement | null>(null);
  const workingRef = useRef(false);
  const [cardName, setCardName] = useState(defaultName);
  const [ready, setReady] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [working, setWorking] = useState(false);
  const [statusText, setStatusText] = useState('Loading secure card field…');
  const [nameError, setNameError] = useState('');
  const [cardError, setCardError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;
    let mounted = false;

    async function init() {
      const { ok, data } = await requestJson('/api/account/payment/config');
      const publishableKey = typeof data.publishableKey === 'string' ? data.publishableKey : '';
      if (!ok || !publishableKey) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Card form is unavailable.');
      }
      await loadStripeJs();
      if (!active || !mountRef.current) return;
      const factory = (window as Window & { Stripe?: StripeFactory }).Stripe;
      if (typeof factory !== 'function') throw new Error('Could not load the secure card field.');
      const stripe = factory(publishableKey);
      const card = stripe.elements().create('card', {
        hidePostalCode: false,
        style: {
          base: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            color: '#17302e',
            '::placeholder': { color: '#8b9aa0' },
          },
          invalid: { color: '#8c3a2f' },
        },
      });
      card.on('change', (event) => {
        setCardComplete(!!event.complete);
        setCardError(event.error?.message || '');
      });
      card.on('ready', () => {
        if (!active) return;
        setReady(true);
        setStatusText('Secured by Stripe. Nothing is charged today.');
      });
      if (!active || !mountRef.current) return;
      stripeRef.current = stripe;
      cardRef.current = card;
      card.mount(mountRef.current);
      mounted = true;
    }

    init().catch((err: unknown) => {
      if (!active) return;
      setStatusText(err instanceof Error ? err.message : 'Card form is unavailable.');
    });

    return () => {
      active = false;
      if (mounted) cardRef.current?.unmount();
      cardRef.current = null;
      stripeRef.current = null;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (workingRef.current) return;
    setNameError('');
    setFormError('');

    const name = cardName.trim();
    if (name.length < 2 || name.length > 120) {
      setNameError('Enter the name on the card.');
      return;
    }
    const stripe = stripeRef.current;
    const card = cardRef.current;
    if (!ready || !stripe || !card) {
      setCardError('The secure card field isn’t ready yet.');
      return;
    }
    if (!cardComplete) {
      setCardError('Enter the card number, expiry, CVC, and ZIP.');
      return;
    }

    workingRef.current = true;
    setWorking(true);
    try {
      const setup = await postJson('/api/account/payment/setup-intent');
      if (setup.alreadyOnFile === true) {
        onSaved({
          brand: typeof setup.brand === 'string' && setup.brand ? setup.brand : 'Card',
          last4: typeof setup.last4 === 'string' ? setup.last4 : '',
        });
        return;
      }
      const clientSecret = typeof setup.clientSecret === 'string' ? setup.clientSecret : '';
      if (!clientSecret) throw new Error('Card setup could not be completed. Try again.');

      const confirmed = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card,
          billing_details: { name, email },
        },
      });
      if (confirmed.error) throw new Error(confirmed.error.message || 'The card was not saved.');
      const setupIntentId = confirmed.setupIntent?.id || '';
      if (!setupIntentId) throw new Error('The card was not saved. Check the card and try again.');

      const saved = await postJson('/api/account/payment/complete', { setupIntentId });
      onSaved({
        brand: typeof saved.brand === 'string' && saved.brand ? saved.brand : 'Card',
        last4: typeof saved.last4 === 'string' ? saved.last4 : '',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save the card.');
      workingRef.current = false;
      setWorking(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="muted" style={{ fontSize: 12.5, margin: '8px 0 12px' }}>
        Card details are entered in Stripe’s secure field and are not stored on this site. Nothing is charged now.
      </p>
      <div className="field">
        <label htmlFor="pm-card-name">Name on card</label>
        <input
          id="pm-card-name"
          value={cardName}
          onChange={(event) => {
            setCardName(event.target.value);
            setNameError('');
          }}
          autoComplete="cc-name"
          placeholder="Name on card"
          aria-invalid={nameError ? 'true' : 'false'}
        />
        {nameError && <p className="field-err">{nameError}</p>}
      </div>
      <div className="field">
        <label htmlFor="pm-card-element">Card</label>
        <div
          id="pm-card-element"
          ref={mountRef}
          className="card-mount"
          role="group"
          aria-label="Card number, expiry, CVC, and ZIP"
          aria-invalid={cardError ? 'true' : 'false'}
          aria-describedby="pm-card-status"
        />
        <p className="muted" id="pm-card-status" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
          {statusText}
        </p>
        {cardError && <p className="field-err">{cardError}</p>}
      </div>
      <button className="btn btn-primary" type="submit" disabled={working}>
        {working ? 'Saving card…' : 'Add payment method'}
      </button>
      {formError && (
        <div className="note err" role="alert">
          {formError}
        </div>
      )}
    </form>
  );
}
