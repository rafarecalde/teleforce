'use client';

import { useState } from 'react';
import { ADD_EA_ACK_TEXT } from '@/lib/constants';
import { EA_BILINGUAL, EA_FOCUS, EA_START } from '@/lib/ea-request-fields';

type Status = 'idle' | 'working' | 'done' | 'error';

export default function AddEaForm({ persist = false }: { persist?: boolean }) {
  const [focus, setFocus] = useState('');
  const [tasks, setTasks] = useState('');
  const [bilingual, setBilingual] = useState('');
  const [startTiming, setStartTiming] = useState('');
  const [notes, setNotes] = useState('');
  const [ack, setAck] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('working');
    setMessage('');

    if (!persist) {
      window.setTimeout(() => setStatus('done'), 400);
      return;
    }

    try {
      const res = await fetch('/api/account/ea-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          focus,
          tasks,
          bilingual,
          startTiming,
          notes,
          acknowledged: ack,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'Could not send the request. Try again.');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
      setMessage('Could not send the request. Try again.');
    }
  }

  if (status === 'done') {
    return (
      <div className="note ok" role="status">
        Request received. We’ll match a full-time EA to the work you described and follow up with
        timing. Nothing is charged until that EA starts.
      </div>
    );
  }

  return (
    <form onSubmit={submit} autoComplete="off">
      <div className="field">
        <label htmlFor="ea-focus">What should this EA focus on?</label>
        <select id="ea-focus" required value={focus} onChange={(e) => setFocus(e.target.value)}>
          <option value="" disabled>
            Select a focus
          </option>
          {EA_FOCUS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="ea-tasks">Talents and tasks to cover</label>
        <textarea
          id="ea-tasks"
          required
          value={tasks}
          onChange={(e) => setTasks(e.target.value)}
          placeholder="Inbox, travel, reporting, research, CRM updates…"
        />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="ea-bilingual">Bilingual English / Spanish</label>
          <select
            id="ea-bilingual"
            required
            value={bilingual}
            onChange={(e) => setBilingual(e.target.value)}
          >
            <option value="" disabled>
              Select
            </option>
            {EA_BILINGUAL.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ea-start">Preferred start</label>
          <select
            id="ea-start"
            required
            value={startTiming}
            onChange={(e) => setStartTiming(e.target.value)}
          >
            <option value="" disabled>
              Select
            </option>
            {EA_START.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="ea-notes">Notes</label>
        <textarea
          id="ea-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tools, team context, anything the match should know."
        />
      </div>

      <label className="ack">
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
        <span>{ADD_EA_ACK_TEXT}</span>
      </label>

      {status === 'error' && (
        <div className="note err" role="alert" style={{ marginTop: 0 }}>
          {message}
        </div>
      )}

      <button className="btn btn-primary" type="submit" disabled={!ack || status === 'working'}>
        {status === 'working' ? 'Sending…' : 'Request another EA'}
      </button>
    </form>
  );
}
