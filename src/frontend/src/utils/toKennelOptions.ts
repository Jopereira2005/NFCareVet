import type { SelectOption } from '@/components/ui/select/Select';
import type { Kennel } from '@/interfaces/kennel.types';

/** Kennels as select options: occupied ones stay listed (with who is there) but can't be picked. */
export function toKennelOptions(kennels: Kennel[], excludeKennelId?: string): SelectOption[] {
  return kennels
    .filter(({ id }) => id !== excludeKennelId)
    .map(({ id, name, occupant }) => ({
      value: id,
      label: occupant ? `${name} — ocupada (${occupant.patientName})` : name,
      disabled: Boolean(occupant),
    }));
}
