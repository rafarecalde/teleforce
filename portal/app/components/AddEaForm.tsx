'use client';

import { useState } from 'react';
import { ADD_EA_ACK_TEXT } from '@/lib/constants';

export default function AddEaForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    title: '',
    timezone: '',
    start: '',
    notes: '',
  });
  const [ack, setAck] = useState(false);
  const [status, setStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('working');
    try {
      const res = await fetch('/api/request/add-ea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ack }),
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
        Request received. We&apos;ll confirm the match and kickoff date by email. You won&apos;t be
        charged until the new EA starts.
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="grid2">
        <div className="field">
          <label htmlFor="ea-name">Executive&apos;s name</label>
          <input id="ea-name" value={form.name} onChange={set('name')} required />
        </div>
        <div className="field">
          <label htmlFor="ea-email">Executive&apos;s email</label>
          <input id="ea-email" type="email" value={form.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="ea-title">Title</label>
          <input id="ea-title" value={form.title} onChange={set('title')} />
        </div>
        <div className="field">
          <label htmlFor="ea-tz">Time zone</label>
          <input id="ea-tz" placeholder="e.g. ET / PT" value={form.timezone} onChange={set('timezone')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="ea-start">Preferred start</label>
        <input id="ea-start" placeholder="e.g. in 2 weeks, or a date" value={form.start} onChange={set('start')} />
      </div>
      <div className="field">
        <label htmlFor="ea-notes">Notes</label>
        <textarea id="ea-notes" placeholder="What you'll delegate, must-haves, anything else…" value={form.notes} onChange={set('notes')} />
      </div>

      <label className="ack">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span>{ADD_EA_ACK_TEXT}</span>
      </label>

      <button className="btn btn-primary" type="submit" disabled={!ack || status === 'working'}>
        {status === 'working' ? 'Sending…' : 'Submit request'}
      </button>
      {error && (
        <div className="note err" role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
