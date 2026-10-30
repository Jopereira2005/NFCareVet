/** Dates relative to "now", so mocks keep saying "hoje", "ontem" or "em atraso" whenever they run. */
export function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function daysAgoAt(daysAgo: number, hours: number, minutes = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export function yearsAgo(years: number, extraMonths = 0): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years, date.getMonth() - extraMonths);
  return date.toISOString().slice(0, 10);
}
