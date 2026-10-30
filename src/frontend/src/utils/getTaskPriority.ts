import type { PendingScheduleItem, TaskPriority } from '@/interfaces/prescription.types';

const URGENT_WINDOW_MINUTES = 60;

/** Overdue items are high priority; items due within the next hour are medium; the rest are low. */
export function getTaskPriority({ isOverdue, item }: Pick<PendingScheduleItem, 'isOverdue' | 'item'>, now: Date = new Date()): TaskPriority {
  if (isOverdue) return 'high';

  const minutesUntilDue = (Date.parse(String(item.scheduledTime)) - now.getTime()) / 60_000;
  return minutesUntilDue <= URGENT_WINDOW_MINUTES ? 'medium' : 'low';
}
