/** Reads numbers typed the Brazilian way ("28,4") as well as "28.4"; returns undefined for empty or invalid text. */
export function parseDecimal(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;

  const number = Number(value.trim().replace(',', '.'));
  return Number.isFinite(number) ? number : undefined;
}
