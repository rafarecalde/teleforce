import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, isOverdue, type TaskBoardData } from '@/lib/task-types';

function formatDue(ymd: string): string {
  if (!ymd) return 'No due date';
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return ymd;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function AdminTasks({ userId, board }: { userId: string; board: TaskBoardData | null }) {
  if (!board) {
    return (
      <section className="card">
        <h2>Tasks</h2>
        <p className="hint">Tasks didn’t load. Refresh and try again.</p>
      </section>
    );
  }

  return (
    <section className="card" id="admin-tasks">
      <h2>Tasks</h2>
      <p className="hint">
        Status and comments here are the EA side. The client still owns the list.
      </p>
      <div className="cal-connect">
        <h3 className="subhead">EA calendar</h3>
        <p className="hint">This link is for the EA. Same due dates as the client’s private feed. No Google login is stored here.</p>
        <p className="meet-actions">
          <a className="btn btn-ghost" href={board.feeds.eaSubscribeUrl} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>
        </p>
        <div className="field">
          <label htmlFor="admin-ea-cal">EA subscribe link</label>
          <input id="admin-ea-cal" className="cal-url" readOnly value={board.feeds.eaSubscribeUrl} spellCheck={false} />
        </div>
        <p className="hint">Client link, if you need to resend it.</p>
        <input className="cal-url" readOnly value={board.feeds.clientSubscribeUrl} spellCheck={false} aria-label="Client subscribe link" />
      </div>
      {board.tasks.length === 0 ? (
        <p className="hint">No tasks yet. The client can assign the first one from their portal.</p>
      ) : (
        <ul className="task-list">
          {board.tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status, board.today);
            return (
              <li key={task.id} className={`task${overdue ? ' overdue' : ''}`}>
                <div className="task-top">
                  <strong className="task-title">{task.title}</strong>
                  <span className={`prio prio-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
                  <span className={overdue ? 'overdue-flag' : 'muted'}>
                    {overdue ? `Overdue · ${formatDue(task.dueDate)}` : formatDue(task.dueDate)}
                  </span>
                </div>
                {task.notes && <p className="hint">{task.notes}</p>}
                {task.link && (
                  <p className="hint"><a href={task.link} target="_blank" rel="noopener noreferrer">Open link</a></p>
                )}
                <form action="/api/admin/tasks" method="post" className="task-admin-row">
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="intent" value="status" />
                  <label className="muted" htmlFor={`admin-status-${task.id}`}>Status</label>
                  <select id={`admin-status-${task.id}`} name="status" defaultValue={task.status}>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost btn-tiny" type="submit">Update status</button>
                </form>
                {task.comments.length > 0 && (
                  <ul className="task-comments">
                    {task.comments.map((comment) => (
                      <li key={comment.id}>
                        <div className="who">{comment.authorName}</div>
                        <div>{comment.body}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <form action="/api/admin/tasks" method="post">
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="intent" value="comment" />
                  <div className="field">
                    <label htmlFor={`admin-comment-${task.id}`}>Comment as the EA</label>
                    <textarea id={`admin-comment-${task.id}`} name="body" maxLength={2000} />
                  </div>
                  <button className="btn btn-ghost btn-tiny" type="submit">Add comment</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
      <p className="hint">Order on this screen follows the client’s list. Priorities: {PRIORITIES.map((item) => PRIORITY_LABEL[item]).join(', ')}.</p>
    </section>
  );
}
