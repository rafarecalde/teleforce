'use client';

import { useState } from 'react';

export default function SeatRequest({ label }: { type?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setTimeout(() => setStatus('done'), 500);
  }

  if (status === 'done') {
    return (
      <div className="note ok" role="status">
        Request sent — your account manager would follow up to scope it. No charge until you agree
        on the details.
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
        <label>{label} — what do you need?</label>
        <textarea placeholder="Rough volume, hours, languages, anything relevant…" />
      </div>
      <button className="btn btn-ghost" type="submit" disabled={status === 'working'}>
        {status === 'working' ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}
