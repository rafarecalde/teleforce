'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarConnect from './CalendarConnect';
import { PRIORITIES, PRIORITY_LABEL, type CalendarLinks } from '@/lib/task-types';

export default function FirstTaskPrompt({
  signedIn,
  tasksHref,
  feeds,
}: {
  signedIn: boolean;
  tasksHref: string;
  feeds: CalendarLinks | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/account/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate, priority, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Couldn’t save that task. Try again.');
      setTitle('');
      setDueDate('');
      setPriority('normal');
      setNotes('');
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Couldn’t save that task. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="task-prompt" id="first-task">
      <h3 className="subhead">Assign a first task</h3>
      <p className="hint">
        Want your EA to arrive with work waiting? Assign a first task. It&apos;s optional, and booking stays first.
      </p>
      {signedIn ? (
        <form onSubmit={onSubmit} autoComplete="off">
          <div className="field">
            <label htmlFor="first-task-title">Title</label>
            <input
              id="first-task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
              required
              placeholder="What should they pick up first?"
            />
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="first-task-due">Due date</label>
              <input id="first-task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="first-task-priority">Priority</label>
              <select id="first-task-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>{PRIORITY_LABEL[item]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="first-task-notes">Notes</label>
            <textarea
              id="first-task-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              placeholder="Optional. A sentence is plenty."
            />
          </div>
          {error && <p className="note err" role="alert">{error}</p>}
          {saved && <p className="note ok" role="status">Assigned. Your EA will see it on the task board.</p>}
          <button className="btn btn-ghost" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Assign task'}
          </button>
        </form>
      ) : (
        <p className="meet-actions">
          <a className="btn btn-ghost" href={tasksHref}>Assign it in your portal</a>
        </p>
      )}
      {feeds ? <CalendarConnect feeds={feeds} compact /> : (
        <p className="hint">You can connect Google Calendar from the Tasks tab after you sign in.</p>
      )}
    </div>
  );
}
