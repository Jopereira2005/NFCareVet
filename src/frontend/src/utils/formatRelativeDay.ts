const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const formatTime = (value: string | Date) =>
  new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

/** Formats a date as "hoje às 10:15", "ontem às 18:20" or "12/10 às 08:00". */
export function formatRelativeDay(value: string | Date, now: Date = new Date()): string {
  const date = new Date(value);
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / MS_PER_DAY);
  const time = formatTime(date);

  if (daysAgo === 0) return `hoje às ${time}`;
  if (daysAgo === 1) return `ontem às ${time}`;
  return `${dateFormatter.format(date)} às ${time}`;
}
