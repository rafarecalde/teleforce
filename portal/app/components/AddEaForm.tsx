'use client';

import { useState } from 'react';
import { ADD_EA_ACK_TEXT } from '@/lib/constants';

export default function AddEaForm() {
  const [ack, setAck] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setTimeout(() => setStatus('done'), 500);
  }

  if (status === 'done') {
    return (
      <div className="note ok" role="status">
        Request received. Your account manager would confirm the match and kickoff date. You
        won&apos;t be charged until the new EA starts.
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="grid2">
        <div className="field">
          <label htmlFor="ea-name">Executive&apos;s name</label>
          <input id="ea-name" required />
        </div>
        <div className="field">
          <label htmlFor="ea-email">Executive&apos;s email</label>
          <input id="ea-email" type="email" />
        </div>
        <div className="field">
          <label htmlFor="ea-title">Title</label>
          <input id="ea-title" />
        </div>
        <div className="field">
          <label htmlFor="ea-tz">Time zone</label>
          <input id="ea-tz" placeholder="e.g. ET / PT" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="ea-start">Preferred start</label>
        <input id="ea-start" placeholder="e.g. in 2 weeks, or a date" />
      </div>
      <div className="field">
        <label htmlFor="ea-notes">Notes</label>
        <textarea id="ea-notes" placeholder="What you'll delegate, must-haves, anything else…" />
      </div>

      <label className="ack">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span>{ADD_EA_ACK_TEXT}</span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={!ack || status === 'working'}>
        {status === 'working' ? 'Sending…' : 'Submit request'}
      </button>
    </form>
  );
}
