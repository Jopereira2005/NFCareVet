import { pluralize } from './pluralize';

/** Formats a birth date as "4 anos e 2 meses", "7 anos" or "5 meses". */
export function formatAge(birthDate: string | Date, now: Date = new Date()): string {
  const birth = new Date(birthDate);
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearsLabel = pluralize(years, 'ano', 'anos');
  const monthsLabel = pluralize(remainingMonths, 'mês', 'meses');

  if (years === 0) return monthsLabel;
  if (remainingMonths === 0) return yearsLabel;
  return `${yearsLabel} e ${monthsLabel}`;
}
