export const PRIORITIES = ['urgent', 'high', 'normal', 'low'] as const;
export const STATUSES = ['todo', 'in_progress', 'waiting', 'done'] as const;

export type TaskPriority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof STATUSES)[number];
export type TaskOrderMode = 'auto' | 'manual';
export type TaskAuthorRole = 'client' | 'admin';

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  waiting: 'Waiting on you',
  done: 'Done',
};

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export type TaskCommentView = {
  id: string;
  authorRole: TaskAuthorRole;
  authorName: string;
  body: string;
  createdAt: string;
};

export type TaskView = {
  id: string;
  title: string;
  notes: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  link: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskCommentView[];
};

export type CalendarLinks = {
  clientSubscribeUrl: string;
  eaSubscribeUrl: string;
};

export type TaskBoardData = {
  tasks: TaskView[];
  mode: TaskOrderMode;
  feeds: CalendarLinks;
  today: string;
};

export function isTaskPriority(value: string): value is TaskPriority {
  return (PRIORITIES as readonly string[]).includes(value);
}

export function isTaskStatus(value: string): value is TaskStatus {
  return (STATUSES as readonly string[]).includes(value);
}

/** A due date before today in America/New_York, and not done. */
export function isOverdue(dueDate: string, status: TaskStatus, today: string): boolean {
  return dueDate !== '' && status !== 'done' && dueDate < today;
}

type SortableTask = {
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
};

/** Overdue first, then priority, then due date. Empty due dates sort last. */
export function compareAuto(a: SortableTask, b: SortableTask, today: string): number {
  const aOver = isOverdue(a.dueDate, a.status, today) ? 0 : 1;
  const bOver = isOverdue(b.dueDate, b.status, today) ? 0 : 1;
  if (aOver !== bOver) return aOver - bOver;
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) return byPriority;
  const aDue = a.dueDate || '9999-99-99';
  const bDue = b.dueDate || '9999-99-99';
  if (aDue !== bDue) return aDue < bDue ? -1 : 1;
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? -1 : 1;
  return 0;
}

/**
 * Reorder the visible ids inside the full list. Hidden items keep their slots.
 * Returns null when the ids are not a unique subset of the list.
 */
export function applyVisibleOrder<T extends { id: string }>(items: T[], visibleIds: string[]): T[] | null {
  if (visibleIds.length === 0 || new Set(visibleIds).size !== visibleIds.length) return null;
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const id of visibleIds) {
    if (!byId.has(id)) return null;
  }
  const moving = new Set(visibleIds);
  const queue = [...visibleIds];
  return items.map((item) => (moving.has(item.id) ? byId.get(queue.shift() as string)! : item));
}
