export function normalizePath(value: string): string {
  const normalized = value.trim();
  return normalized.startsWith('/') ? normalized : `/${normalized}`;
}
