/** "412.733.905-09" → "412.***.***-09": keeps the first and last digits visible on lists. */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;

  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}
