/** Returns "1 resultado" / "3 resultados" style labels. */
export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
