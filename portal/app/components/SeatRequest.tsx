'use client';

import { useState } from 'react';

export default function SeatRequest({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setTimeout(() => setStatus('done'), 400);
  }

  if (status === 'done') {
    return (
      <div className="note ok" role="status">
        Noted. We’ll follow up about {label.toLowerCase()}. Your EA seat stays on the plan you already
        chose.
      </div>
    );
  }

  if (!open) {
    return (
      <button className="btn-link" type="button" onClick={() => setOpen(true)}>
        Request {label.toLowerCase()}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="aside-form">
      <div className="field">
        <label>
          {label} — what should we scope?
        </label>
        <textarea placeholder="What should we look at?" required />
      </div>
      <button className="btn btn-ghost" type="submit" disabled={status === 'working'}>
        {status === 'working' ? 'Sending…' : 'Send note'}
      </button>
    </form>
  );
}
