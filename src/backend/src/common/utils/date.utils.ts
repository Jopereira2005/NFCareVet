export function calculateAgeDisplay(birthDate?: Date | string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  const days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years < 0) return null;

  if (years === 0 && months === 0) {
    const diffDays = Math.max(
      0,
      Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)),
    );
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
  }

  if (years === 0) {
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }

  return `${years} ${years === 1 ? 'ano' : 'anos'} e ${months} ${months === 1 ? 'mês' : 'meses'}`;
}
