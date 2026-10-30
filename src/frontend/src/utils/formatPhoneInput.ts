/** Masks Brazilian phones while typing: "15991233292" → "(15) 99123-3292"; landlines get 4+4 digits. */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';

  const areaCode = digits.slice(0, 2);
  const number = digits.slice(2);
  const splitAt = number.length > 8 ? 5 : 4;

  return number.length > splitAt ? `(${areaCode}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}` : `(${areaCode}) ${number}`;
}
