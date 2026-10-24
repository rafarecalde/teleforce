import { STATUS_LABEL, STATUSES, isOverdue, type TaskBoardData } from '@/lib/task-types';

function formatDue(ymd: string): string {
  if (!ymd) return 'No due date';
  const [year, month, day] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return ymd;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export default function EaTasks({
  userId,
  clientName,
  board,
}: {
  userId: string;
  clientName: string;
  board: TaskBoardData;
}) {
  return (
    <div id="ea-tasks">
      <div className="cal-connect" id="ea-calendar">
        <h3 className="subhead">Your calendar</h3>
        <p className="hint">Due dates for {clientName}. This feed is only yours.</p>
        <p className="meet-actions">
          <a className="btn btn-ghost" href={board.feeds.eaSubscribeUrl} target="_blank" rel="noopener noreferrer">
            Add to Google Calendar
          </a>
        </p>
      </div>
      {board.tasks.length === 0 ? (
        <p className="hint">No tasks yet. They’ll show up here when {clientName} adds one.</p>
      ) : (
        <ul className="task-list">
          {board.tasks.map((task) => {
            const overdue = isOverdue(task.dueDate, task.status, board.today);
            return (
              <li key={task.id} className={`task${overdue ? ' overdue' : ''}`}>
                <div className="task-top">
                  <strong className="task-title">{task.title}</strong>
                  <span className={overdue ? 'overdue-flag' : 'muted'}>
                    {overdue ? `Overdue · ${formatDue(task.dueDate)}` : formatDue(task.dueDate)}
                  </span>
                </div>
                {task.notes && <p className="hint">{task.notes}</p>}
                {task.link && (
                  <p className="hint"><a href={task.link} target="_blank" rel="noopener noreferrer">Open link</a></p>
                )}
                <form action="/api/ea/tasks" method="post" className="task-admin-row">
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="intent" value="status" />
                  <label className="muted" htmlFor={`ea-status-${task.id}`}>Status</label>
                  <select id={`ea-status-${task.id}`} name="status" defaultValue={task.status}>
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{STATUS_LABEL[status]}</option>
                    ))}
                  </select>
                  <button className="btn btn-ghost btn-tiny" type="submit">Update status</button>
                </form>
                {task.status !== 'done' && (
                  <form action="/api/ea/tasks" method="post">
                    <input type="hidden" name="userId" value={userId} />
                    <input type="hidden" name="taskId" value={task.id} />
                    <input type="hidden" name="intent" value="done" />
                    <button className="btn btn-ghost btn-tiny" type="submit">Mark done</button>
                  </form>
                )}
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
                <form action="/api/ea/tasks" method="post">
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="intent" value="comment" />
                  <div className="field">
                    <label htmlFor={`ea-comment-${task.id}`}>Comment</label>
                    <textarea id={`ea-comment-${task.id}`} name="body" maxLength={2000} placeholder="A note for your client" />
                  </div>
                  <button className="btn btn-ghost btn-tiny" type="submit">Add comment</button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
