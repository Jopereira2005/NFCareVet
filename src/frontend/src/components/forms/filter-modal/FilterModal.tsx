import { useState } from 'react';

import { Button } from '@/components/ui/button/Button';
import { ChoiceGroup } from '@/components/ui/choice-group/ChoiceGroup';
import { Modal } from '@/components/ui/modal/Modal';
import type { FilterDefinition } from '@/hooks/useSearchFilters';

const ALL_OPTION = { value: '', label: 'Todos' };

type FilterModalProps = {
  title?: string;
  definitions: FilterDefinition[];
  activeIds: string[];
  onApply: (filterIds: string[]) => void;
  onClose: () => void;
};

/** Filters grouped by `group` (one choice per group); changes only take effect on "Aplicar". */
export function FilterModal({ title = 'Filtros', definitions, activeIds, onApply, onClose }: FilterModalProps) {
  const groups = [...new Set(definitions.map(({ group }) => group))];
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map((group) => [group, definitions.find((filter) => filter.group === group && activeIds.includes(filter.id))?.id ?? ''])),
  );

  const apply = () => {
    onApply(Object.values(draft).filter(Boolean));
    onClose();
  };

  return (
    <Modal
      title={title}
      description="Refine os resultados; escolha uma opção por grupo."
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={() => setDraft(Object.fromEntries(groups.map((group) => [group, ''])))}>
            Limpar
          </Button>
          <Button onClick={apply}>Aplicar filtros</Button>
        </>
      }
    >
      {groups.map((group) => (
        <ChoiceGroup
          key={group}
          name={`filter-${group}`}
          label={group}
          options={[
            ALL_OPTION,
            ...definitions.filter((filter) => filter.group === group).map(({ id, label, icon }) => ({ value: id, label, icon })),
          ]}
          value={draft[group]}
          onChange={(filterId) => setDraft((current) => ({ ...current, [group]: filterId }))}
        />
      ))}
    </Modal>
  );
}
