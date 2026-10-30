import { CircleX, Search, SlidersHorizontal } from 'lucide-react';

import styles from './search-bar.module.scss';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Shows the filter button when provided. */
  onFilterClick?: () => void;
  /** Reflected as aria-expanded on the filter button. */
  isFilterOpen?: boolean;
};

export function SearchBar({ value, onChange, placeholder = 'Pesquise...', label = 'Pesquisar', onFilterClick, isFilterOpen }: SearchBarProps) {
  return (
    <div className={styles['search-bar']} role="search">
      <label className={styles['search-bar__field']}>
        <Search className={styles['search-bar__field__icon']} aria-hidden="true" />
        <input
          className={styles['search-bar__field__input']}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
        />
        {value && (
          <button type="button" className={styles['search-bar__field__clear']} aria-label="Limpar busca" onClick={() => onChange('')}>
            <CircleX aria-hidden="true" />
          </button>
        )}
      </label>

      {onFilterClick && (
        <button type="button" className={styles['search-bar__filter']} aria-label="Filtros" aria-expanded={isFilterOpen} onClick={onFilterClick}>
          <SlidersHorizontal aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
