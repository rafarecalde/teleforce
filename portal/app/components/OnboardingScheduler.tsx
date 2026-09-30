'use client';

import { useEffect, useRef, useState } from 'react';
import { ONBOARDING_CALENDLY_URL } from '@/lib/constants';

type CalendlyApi = {
  initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void;
};

const WIDGET_SRC = 'https://assets.calendly.com/assets/external/widget.js';

let calendlyJs: Promise<void> | null = null;

function loadCalendlyJs(): Promise<void> {
  const host = window as Window & { Calendly?: CalendlyApi };
  if (host.Calendly?.initInlineWidget) return Promise.resolve();
  if (!calendlyJs) {
    calendlyJs = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WIDGET_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        calendlyJs = null;
        reject(new Error('Could not load the scheduler.'));
      };
      document.head.appendChild(script);
    });
  }
  return calendlyJs;
}

/** Mounted only while the onboarding card is open, so Calendly stays unloaded until then. */
export default function OnboardingScheduler() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const parent = parentRef.current;
    if (!parent) return;

    loadCalendlyJs()
      .then(() => {
        if (!active || !parentRef.current) return;
        if (parentRef.current.querySelector('iframe')) return;
        const calendly = (window as Window & { Calendly?: CalendlyApi }).Calendly;
        if (!calendly?.initInlineWidget) throw new Error('Could not load the scheduler.');
        calendly.initInlineWidget({
          url: ONBOARDING_CALENDLY_URL,
          parentElement: parentRef.current,
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Could not load the scheduler.');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <p className="hint">
        About 60 minutes, with a prep sheet beforehand. Nothing is charged on this call.
      </p>
      <div
        ref={parentRef}
        className="calendly-inline-widget"
        data-url={ONBOARDING_CALENDLY_URL}
      />
      {error && <p className="field-err">{error}</p>}
      <p className="muted" style={{ fontSize: 13.5, margin: '12px 0 0' }}>
        <a href={ONBOARDING_CALENDLY_URL} target="_blank" rel="noopener noreferrer">
          Open the scheduler
        </a>
      </p>
    </>
  );
}
