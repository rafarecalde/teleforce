'use client';

import { useState } from 'react';

export default function SeatRequest({
  type,
  label,
}: {
  type: 'customer_service' | 'sdr';
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('working');
    try {
      const res = await fetch('/api/request/seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not send the request.');
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
        Request sent — we&apos;ll follow up by email to scope it. No charge until we agree on the
        details.
      </div>
    );
  }

  if (!open) {
    return (
      <button className="btn btn-ghost" onClick={() => setOpen(true)}>
        Request {label.toLowerCase()}
      </button>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor={`notes-${type}`}>{label} — what do you need?</label>
        <textarea
          id={`notes-${type}`}
          placeholder="Rough volume, hours, languages, anything relevant…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button className="btn btn-ghost" type="submit" disabled={status === 'working'}>
        {status === 'working' ? 'Sending…' : 'Send request'}
      </button>
      {error && (
        <div className="note err" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
