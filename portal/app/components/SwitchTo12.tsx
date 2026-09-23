'use client';

import { useState } from 'react';
import { SWITCH_ACK_TEXT } from '@/lib/constants';

export default function SwitchTo12({
  subscriptionId,
  rate12,
  monthlySavings,
  annualSavings,
  commitmentEndPreview,
}: {
  subscriptionId: string;
  rate12: string;
  monthlySavings: string;
  annualSavings: string;
  commitmentEndPreview: string;
}) {
  const [ack, setAck] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const [error, setError] = useState('');

  async function confirm() {
    setError('');
    setStatus('working');
    try {
      const res = await fetch('/api/plan/switch-to-12', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, ack: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not update the plan. Please try again.');
        setStatus('idle');
        return;
      }
      setStatus('done');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <div className="note ok" role="status">
        Done — your plan is now on a 12-month term at {rate12}/month. We&apos;ve emailed you a
        confirmation. Refresh to see the update.
      </div>
    );
  }

  return (
    <div>
      <p className="subhead">Switch to the 12-month rate</p>
      <p style={{ fontSize: 14, margin: '0 0 12px' }}>
        Move this plan to {rate12}/month and <span className="savings">save {monthlySavings}/month</span>{' '}
        ({annualSavings}/year). A new 12-month initial period starts today, ending{' '}
        {commitmentEndPreview}.
      </p>

      <label className="ack">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          aria-label="I agree to the amendment"
        />
        <span>{SWITCH_ACK_TEXT}</span>
      </label>

      <button
        className="btn btn-primary"
        onClick={confirm}
        disabled={!ack || status === 'working'}
      >
        {status === 'working' ? 'Updating…' : 'Confirm switch to 12-month'}
      </button>

      {error && (
        <div className="note err" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
