'use client';

import { useState } from 'react';
import { SWITCH_ACK_TEXT } from '@/lib/constants';

export default function SwitchTo12({
  rate12,
  monthlySavings,
  annualSavings,
  commitmentEndPreview,
}: {
  rate12: string;
  monthlySavings: string;
  annualSavings: string;
  commitmentEndPreview: string;
}) {
  const [ack, setAck] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');

  function confirm() {
    setStatus('working');
    setTimeout(() => setStatus('done'), 500); // preview — no real change is made
  }

  if (status === 'done') {
    return (
      <div className="note ok" role="status">
        Done — your plan is now on the 12-month rate at {rate12}/month. A confirmation would be
        emailed to you.
      </div>
    );
  }

  return (
    <div>
      <p className="subhead">Switch to the 12-month rate</p>
      <p style={{ fontSize: 14, margin: '0 0 12px' }}>
        Move this plan to {rate12}/month and <span className="savings">save {monthlySavings}/month</span>{' '}
        ({annualSavings}/year). A new 12-month initial period starts today, ending {commitmentEndPreview}.
      </p>

      <label className="ack">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span>{SWITCH_ACK_TEXT}</span>
      </label>

      <button className="btn btn-primary" onClick={confirm} disabled={!ack || status === 'working'}>
        {status === 'working' ? 'Updating…' : 'Confirm switch to 12-month'}
      </button>
    </div>
  );
}
