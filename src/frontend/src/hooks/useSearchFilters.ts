import { useState } from 'react';
import { useSearchParams } from 'react-router';

import type { ChipOption } from '@/components/ui/chip/Chip';

import { useDebouncedValue } from './useDebouncedValue';

const QUERY_PARAM = 'q';

/** A recent search chip; selecting it fills the field with `query`. */
export type RecentSearchOption = ChipOption & { query: string };

/**
 * A filter backed by a URL param: active while `?{param}={value}` is in the URL.
 * Filters of the same `group` share a param, so only one of them can be applied at a time.
 */
export type FilterDefinition = ChipOption & { group: string; param: string; value: string };

type UseSearchFiltersOptions<TFilter extends FilterDefinition> = {
  /** Every filter the screen supports; the URL decides which ones are applied. */
  filterDefinitions?: TFilter[];
  initialRecentSearches?: RecentSearchOption[];
};

/**
 * State behind <SearchFilters>. The text (`?q=`) and the applied filters live in the URL,
 * so the back button, a reload or a shared link restore the same search. Its return value
 * spreads straight into the component.
 */
export function useSearchFilters<TFilter extends FilterDefinition>({
  filterDefinitions = [],
  initialRecentSearches = [],
}: UseSearchFiltersOptions<TFilter> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recentSearches, setRecentSearches] = useState(initialRecentSearches);

  const query = searchParams.get(QUERY_PARAM) ?? '';
  const debouncedQuery = useDebouncedValue(query.trim());
  const filters = filterDefinitions.filter(({ param, value }) => searchParams.get(param) === value);

  // Typing replaces the history entry: one back press leaves the search, not one letter
  const updateParams = (update: (params: URLSearchParams) => void) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        update(next);
        return next;
      },
      { replace: true },
    );

  const findFilter = (filterId: string) => filterDefinitions.find(({ id }) => id === filterId);

  return {
    query,
    debouncedQuery,
    onQueryChange: (nextQuery: string) =>
      updateParams((params) => (nextQuery ? params.set(QUERY_PARAM, nextQuery) : params.delete(QUERY_PARAM))),
    recentSearches,
    onRecentSelect: (option: RecentSearchOption) => updateParams((params) => params.set(QUERY_PARAM, option.query)),
    onClearRecent: () => setRecentSearches([]),
    filters,
    filterDefinitions,
    /** Replaces the applied filters with `filterIds` in a single URL update. */
    onApplyFilters: (filterIds: string[]) =>
      updateParams((params) => {
        filterDefinitions.forEach(({ param }) => params.delete(param));
        filterDefinitions.filter(({ id }) => filterIds.includes(id)).forEach(({ param, value }) => params.set(param, value));
      }),
    onRemoveFilter: (filterId: string) => {
      const filter = findFilter(filterId);
      if (filter) updateParams((params) => params.delete(filter.param));
    },
    onClearFilters: () => updateParams((params) => filters.forEach(({ param }) => params.delete(param))),
  };
}
