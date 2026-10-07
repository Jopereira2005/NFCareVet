export function hasAccess(role: string): boolean {
  return role === 'admin' || role === 'user';
}
