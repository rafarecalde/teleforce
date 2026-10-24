'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarConnect from './CalendarConnect';
import {
  applyVisibleOrder,
  isOverdue,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  type TaskBoardData,
  type TaskPriority,
  type TaskView,
} from '@/lib/task-types';

function boardSignature(data: Pick<TaskBoardData, 'mode' | 'tasks'>): string {
  return [
    data.mode,
    ...data.tasks.map((task) => [
      task.id,
      task.updatedAt,
      task.status,
      task.title,
      task.dueDate,
      task.priority,
      task.notes,
      task.link,
      task.comments.map((comment) => comment.id).join(','),
    ].join('\t')),
  ].join('\n');
}

function formatDue(ymd: string): string {
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return ymd;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(date);
}

async function send(url: string, body: unknown): Promise<TaskBoardData> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'That didn’t save. Try again.');
  return data as TaskBoardData;
}

export default function TaskBoard({ initial }: { initial: TaskBoardData }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initial.tasks);
  const [mode, setMode] = useState(initial.mode);
  const [filter, setFilter] = useState<'open' | 'done'>('open');
  const [priority, setPriority] = useState<'' | TaskPriority>('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const seen = useRef(boardSignature(initial));
  const incoming = boardSignature(initial);
  if (seen.current !== incoming) {
    seen.current = incoming;
    setTasks(initial.tasks);
    setMode(initial.mode);
  }

  const today = initial.today;
  const visible = tasks.filter((task) => {
    if (filter === 'done' ? task.status !== 'done' : task.status === 'done') return false;
    if (priority && task.priority !== priority) return false;
    return true;
  });

  function adopt(data: TaskBoardData) {
    seen.current = boardSignature(data);
    setTasks(data.tasks);
    setMode(data.mode);
    router.refresh();
  }

  async function run(work: () => Promise<TaskBoardData>): Promise<boolean> {
    setBusy(true);
    setError('');
    try {
      adopt(await work());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That didn’t save. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function persistOrder(ids: string[]) {
    const current = visible.map((task) => task.id).join('\n');
    if (ids.join('\n') === current) return;
    const optimistic = applyVisibleOrder(tasks, ids);
    const snapshot = tasks;
    const snapshotMode = mode;
    if (optimistic) {
      setTasks(optimistic);
      setMode('manual');
    }
    setBusy(true);
    setError('');
    try {
      adopt(await send('/api/account/tasks/reorder', { ids }));
    } catch (err) {
      setTasks(snapshot);
      setMode(snapshotMode);
      setError(err instanceof Error ? err.message : 'Couldn’t save that order. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function move(id: string, direction: -1 | 1) {
    const ids = visible.map((task) => task.id);
    const index = ids.indexOf(id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    const reordered = [...ids];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    void persistOrder(reordered);
  }

  function onDrop(targetId: string) {
    const source = dragId;
    setDragId(null);
    setOverId(null);
    if (!source || source === targetId) return;
    const ids = visible.map((task) => task.id);
    const from = ids.indexOf(source);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...ids];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);
    void persistOrder(reordered);
  }

  return (
    <section className="card" id="tasks">
      <h2>Tasks</h2>
      <p className="hint">
        Shared with your EA. Overdue items sit at the top until you drag a task into your own order.
      </p>
      <CalendarConnect feeds={initial.feeds} />
      <CreateTask busy={busy} onCreate={(body) => run(() => send('/api/account/tasks', body))} />
      {error && <p className="note err" role="alert">{error}</p>}
      <div className="task-filters">
        <button type="button" className="btn btn-ghost btn-tiny" aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>
          Open
        </button>
        <button type="button" className="btn btn-ghost btn-tiny" aria-pressed={filter === 'done'} onClick={() => setFilter('done')}>
          Done
        </button>
        <select
          aria-label="Filter by priority"
          value={priority}
          onChange={(event) => setPriority(event.target.value as '' | TaskPriority)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((item) => (
            <option key={item} value={item}>{PRIORITY_LABEL[item]}</option>
          ))}
        </select>
        {mode === 'manual' && (
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            disabled={busy}
            onClick={() => run(() => send('/api/account/tasks/order', { mode: 'auto' }))}
          >
            Suggested order
          </button>
        )}
      </div>
      {visible.length === 0 ? (
        <p className="hint">{filter === 'done' ? 'Nothing done yet.' : 'No open tasks. Add one and your EA will see it here.'}</p>
      ) : (
        <ul className="task-list">
          {visible.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              today={today}
              busy={busy}
              dropTarget={overId === task.id}
              canMoveUp={index > 0}
              canMoveDown={index < visible.length - 1}
              onMove={move}
              onDrop={onDrop}
              onDragStart={setDragId}
              onDragOver={setOverId}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onPatch={(id, body) => run(async () => {
                const res = await fetch(`/api/account/tasks/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.error || 'That didn’t save. Try again.');
                return data as TaskBoardData;
              })}
              onComment={(id, body) => run(() => send(`/api/account/tasks/${id}/comments`, { body }))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CreateTask({
  busy,
  onCreate,
}: {
  busy: boolean;
  onCreate: (body: { title: string; notes: string; dueDate: string; priority: string; link: string }) => Promise<boolean>;
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [link, setLink] = useState('');

  return (
    <form
      className="task-create"
      autoComplete="off"
      onSubmit={(event) => {
        event.preventDefault();
        void onCreate({ title, notes, dueDate, priority, link }).then((saved) => {
          if (!saved) return;
          setTitle('');
          setNotes('');
          setDueDate('');
          setPriority('normal');
          setLink('');
        });
      }}
    >
      <div className="field">
        <label htmlFor="task-title">New task</label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={140}
          required
          placeholder="Title"
        />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="task-due">Due date</label>
          <input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="task-priority">Priority</label>
          <select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value)}>
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>{PRIORITY_LABEL[item]}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="task-notes">Notes</label>
        <textarea id="task-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} />
      </div>
      <div className="field">
        <label htmlFor="task-link">Link, optional</label>
        <input
          id="task-link"
          value={link}
          onChange={(event) => setLink(event.target.value)}
          maxLength={500}
          inputMode="url"
          placeholder="https://"
        />
      </div>
      <button className="btn btn-ghost" type="submit" disabled={busy}>Add task</button>
    </form>
  );
}

function TaskCard({
  task,
  today,
  busy,
  dropTarget,
  canMoveUp,
  canMoveDown,
  onMove,
  onDrop,
  onDragStart,
  onDragOver,
  onDragEnd,
  onPatch,
  onComment,
}: {
  task: TaskView;
  today: string;
  busy: boolean;
  dropTarget: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onDrop: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  onPatch: (id: string, body: Record<string, string>) => Promise<boolean>;
  onComment: (id: string, body: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [priority, setPriority] = useState(task.priority);
  const [link, setLink] = useState(task.link);
  const [comment, setComment] = useState('');
  const seen = useRef(task.updatedAt + task.comments.length);
  const mark = task.updatedAt + task.comments.length;
  if (seen.current !== mark) {
    seen.current = mark;
    setTitle(task.title);
    setNotes(task.notes);
    setDueDate(task.dueDate);
    setPriority(task.priority);
    setLink(task.link);
  }
  const overdue = isOverdue(task.dueDate, task.status, today);

  return (
    <li
      className={`task${overdue ? ' overdue' : ''}${dropTarget ? ' drop-target' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver(task.id);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop(task.id);
      }}
    >
      <div className="task-top">
        <button
          type="button"
          className="task-handle"
          draggable
          aria-label={`Drag to reorder ${task.title}`}
          onDragStart={(event) => {
            event.dataTransfer.setData('text/plain', task.id);
            event.dataTransfer.effectAllowed = 'move';
            onDragStart(task.id);
          }}
          onDragEnd={onDragEnd}
        >
          <span />
          <span />
          <span />
        </button>
        <button type="button" className="task-title" onClick={() => setOpen((value) => !value)}>
          {task.title}
        </button>
        <span className={`prio prio-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
        {task.dueDate && (
          <span className={overdue ? 'overdue-flag' : 'muted'}>
            {overdue ? `Overdue · ${formatDue(task.dueDate)}` : formatDue(task.dueDate)}
          </span>
        )}
        <select
          aria-label={`Status for ${task.title}`}
          value={task.status}
          disabled={busy}
          onChange={(event) => {
            void onPatch(task.id, { status: event.target.value });
          }}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>{STATUS_LABEL[status]}</option>
          ))}
        </select>
      </div>
      <div className="task-move">
        <button type="button" className="btn btn-ghost btn-tiny" disabled={busy || !canMoveUp} onClick={() => onMove(task.id, -1)}>
          Move up
        </button>
        <button type="button" className="btn btn-ghost btn-tiny" disabled={busy || !canMoveDown} onClick={() => onMove(task.id, 1)}>
          Move down
        </button>
        {task.comments.length > 0 && (
          <span className="muted">{task.comments.length} comment{task.comments.length === 1 ? '' : 's'}</span>
        )}
      </div>
      {open && (
        <form
          className="task-edit"
          onSubmit={(event) => {
            event.preventDefault();
            void onPatch(task.id, { title, notes, dueDate, priority, link });
          }}
        >
          <div className="field">
            <label htmlFor={`title-${task.id}`}>Title</label>
            <input id={`title-${task.id}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} required />
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor={`due-${task.id}`}>Due date</label>
              <input id={`due-${task.id}`} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor={`priority-${task.id}`}>Priority</label>
              <select id={`priority-${task.id}`} value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                {PRIORITIES.map((item) => (
                  <option key={item} value={item}>{PRIORITY_LABEL[item]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor={`notes-${task.id}`}>Notes</label>
            <textarea id={`notes-${task.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} />
          </div>
          <div className="field">
            <label htmlFor={`link-${task.id}`}>Link</label>
            <input id={`link-${task.id}`} value={link} onChange={(event) => setLink(event.target.value)} maxLength={500} inputMode="url" placeholder="https://" />
          </div>
          {task.link && <p className="hint"><a href={task.link} target="_blank" rel="noopener noreferrer">Open link</a></p>}
          <button className="btn btn-ghost btn-tiny" type="submit" disabled={busy}>Save details</button>
        </form>
      )}
      {open && (
        <div className="task-thread">
          {task.comments.length > 0 && (
            <ul className="task-comments">
              {task.comments.map((item) => (
                <li key={item.id}>
                  <div className="who">{item.authorName}{formatWhen(item.createdAt) ? ` · ${formatWhen(item.createdAt)}` : ''}</div>
                  <div>{item.body}</div>
                </li>
              ))}
            </ul>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const body = comment;
              void onComment(task.id, body).then((saved) => {
                if (saved) setComment('');
              });
            }}
          >
            <div className="field">
              <label htmlFor={`comment-${task.id}`}>Comment</label>
              <textarea
                id={`comment-${task.id}`}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={2000}
                placeholder="A note for your EA"
              />
            </div>
            <button className="btn btn-ghost btn-tiny" type="submit" disabled={busy || !comment.trim()}>
              Add comment
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
