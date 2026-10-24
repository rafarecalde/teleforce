'use client';

import { useId, useState } from 'react';
import type { CalendarLinks } from '@/lib/task-types';

export default function CalendarConnect({ feeds, compact = false }: { feeds: CalendarLinks; compact?: boolean }) {
  return (
    <div className={compact ? 'cal-connect compact' : 'cal-connect'}>
      <h3 className="subhead">Connect Calendar</h3>
      <p className="hint">
        Optional. Due dates show on Google Calendar for you and your EA. Nothing else waits on this.
      </p>
      <p className="meet-actions">
        <a className="btn btn-ghost" href={feeds.clientSubscribeUrl} target="_blank" rel="noopener noreferrer">
          Add to Google Calendar
        </a>
      </p>
      <p className="hint">This link is for your EA. It shows the same due dates.</p>
      <p className="meet-actions">
        <a className="btn btn-ghost" href={feeds.eaSubscribeUrl} target="_blank" rel="noopener noreferrer">
          Add to your EA&apos;s Google Calendar
        </a>
      </p>
      <CopyField label="EA subscribe link" value={feeds.eaSubscribeUrl} />
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const fieldId = useId();
  return (
    <div className="field" style={{ marginBottom: 0 }}>
      <label htmlFor={fieldId}>{label}</label>
      <div className="cal-row">
        <input
          id={fieldId}
          className="cal-url"
          readOnly
          value={value}
          spellCheck={false}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          type="button"
          className="btn btn-ghost btn-tiny"
          onClick={() => {
            navigator.clipboard?.writeText(value).then(() => {
              setCopied(true);
            }).catch(() => {
              setCopied(false);
            });
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
