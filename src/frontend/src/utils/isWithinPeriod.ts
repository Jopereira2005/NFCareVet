import type { HistoryPeriod } from '@/interfaces/hospitalization.types';

const DAYS_IN_PERIOD: Record<HistoryPeriod, number> = { today: 0, week: 6, month: 29 };

/** True when the date falls between the start of the period ("today", last 7 or 30 days) and now. */
export function isWithinPeriod(value: string, period: HistoryPeriod, now: Date = new Date()): boolean {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - DAYS_IN_PERIOD[period]);

  const time = Date.parse(value);
  return time >= start.getTime() && time <= now.getTime();
}
