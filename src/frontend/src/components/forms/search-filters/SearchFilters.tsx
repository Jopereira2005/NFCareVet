import { useState } from 'react';
import { Filter, History } from 'lucide-react';

import { Chip, type ChipOption } from '@/components/ui/chip/Chip';
import { ChipGroup } from '@/components/ui/chip-group/ChipGroup';
import type { FilterDefinition, RecentSearchOption } from '@/hooks/useSearchFilters';

import { FilterModal } from '../filter-modal/FilterModal';
import { SearchBar } from '../search-bar/SearchBar';

import styles from './search-filters.module.scss';

type SearchFiltersProps = {
  label: string;
  query: string;
  onQueryChange: (query: string) => void;
  recentSearches: RecentSearchOption[];
  onRecentSelect: (option: RecentSearchOption) => void;
  onClearRecent: () => void;
  /** Omit to hide the filter button and the "Filtros aplicados" group (e.g. the history screen). */
  filters?: ChipOption[];
  filterDefinitions?: FilterDefinition[];
  onApplyFilters?: (filterIds: string[]) => void;
  onRemoveFilter?: (filterId: string) => void;
  onClearFilters?: () => void;
};

/** Search field + "Buscas recentes" + "Filtros aplicados" — pair it with `useSearchFilters`. */
export function SearchFilters({
  label,
  query,
  onQueryChange,
  recentSearches,
  onRecentSelect,
  onClearRecent,
  filters,
  filterDefinitions = [],
  onApplyFilters,
  onRemoveFilter,
  onClearFilters,
}: SearchFiltersProps) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const hasFilters = filters !== undefined && filterDefinitions.length > 0;

  return (
    <div className={styles['search-filters']}>
      <SearchBar
        value={query}
        onChange={onQueryChange}
        label={label}
        onFilterClick={hasFilters ? () => setIsFilterModalOpen(true) : undefined}
        isFilterOpen={isFilterModalOpen}
      />

      <ChipGroup
        title="Buscas recentes"
        icon={History}
        actionLabel="Limpar Histórico"
        onAction={onClearRecent}
        emptyLabel="Nenhuma busca recente."
      >
        {recentSearches.map((option) => (
          <Chip key={option.id} label={option.label} icon={option.icon} onClick={() => onRecentSelect(option)} />
        ))}
      </ChipGroup>

      {hasFilters && (
        <ChipGroup
          title="Filtros aplicados"
          icon={Filter}
          actionLabel="Limpar Filtros"
          onAction={onClearFilters}
          emptyLabel="Nenhum filtro aplicado. Toque no botão de filtros para adicionar."
        >
          {filters.map((filter) => (
            <Chip
              key={filter.id}
              label={filter.label}
              icon={filter.icon}
              tone={filter.tone}
              ariaLabel={`Remover filtro ${filter.label}`}
              onClick={() => onRemoveFilter?.(filter.id)}
            />
          ))}
        </ChipGroup>
      )}

      {isFilterModalOpen && (
        <FilterModal
          definitions={filterDefinitions}
          activeIds={(filters ?? []).map(({ id }) => id)}
          onApply={(filterIds) => onApplyFilters?.(filterIds)}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </div>
  );
}
