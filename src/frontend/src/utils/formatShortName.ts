const NAME_PARTICLES = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

/** "Lucas Silva de Oliveira" → "Lucas Silva": first name plus the next one that isn't a particle. */
export function formatShortName(fullName: string): string {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const secondName = rest.find((part) => !NAME_PARTICLES.has(part.toLowerCase()));

  return secondName ? `${firstName} ${secondName}` : firstName;
}
