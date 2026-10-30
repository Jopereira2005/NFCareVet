const pad = (value: number) => String(value).padStart(2, '0');

/** Date → "YYYY-MM-DDTHH:mm" in local time, the format of <input type="datetime-local">. */
export function toDateTimeLocalValue(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
