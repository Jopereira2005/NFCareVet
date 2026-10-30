const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

/** Formats an ISO date as "Jan/2023". */
export function formatMonthYear(value: string | Date): string {
  const date = new Date(value);
  const month = monthFormatter.format(date).replace('.', '');

  return `${month.charAt(0).toUpperCase()}${month.slice(1)}/${date.getUTCFullYear()}`;
}
