import { Cross, Mars, User, Venus } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import { GuardianCard, PatientCard } from '@/components/features';
import { SearchFilters } from '@/components/forms';
import { PageHeading, SectionHeader } from '@/components/layout';
import { Badge, QueryState } from '@/components/ui';
import { useGuardianSearch } from '@/hooks/queries/useGuardianQueries';
import { usePatientSearch } from '@/hooks/queries/usePatientQueries';
import { useSearchFilters, type FilterDefinition, type RecentSearchOption } from '@/hooks/useSearchFilters';
import type { PatientSearchParams } from '@/services/patient.service';
import { pluralize } from '@/utils/pluralize';

import styles from './search.module.scss';

const RECENT_SEARCHES: RecentSearchOption[] = [
  { id: 'thor', label: 'Thor', query: 'Thor', icon: PawIcon },
  { id: 'lucas', label: 'Lucas Silva', query: 'Lucas Silva', icon: User },
];

/** Each filter maps to a URL param that is also a parameter of the patient search request. */
const FILTER_DEFINITIONS: FilterDefinition[] = [
  { id: 'canine', group: 'Espécie', label: 'Cachorro', icon: PawIcon, tone: 'info', param: 'species', value: 'Canina' },
  { id: 'feline', group: 'Espécie', label: 'Gato', icon: PawIcon, tone: 'info', param: 'species', value: 'Felina' },
  { id: 'male', group: 'Sexo', label: 'Macho', icon: Mars, tone: 'info', param: 'sex', value: 'MALE' },
  { id: 'female', group: 'Sexo', label: 'Fêmea', icon: Venus, tone: 'info', param: 'sex', value: 'FEMALE' },
  { id: 'hospitalized', group: 'Situação', label: 'Hospitalizado', icon: Cross, tone: 'danger', param: 'hospitalized', value: 'true' },
];

const toPatientSearchParams = (query: string, filters: FilterDefinition[]): PatientSearchParams => {
  const params = Object.fromEntries(filters.map(({ param, value }) => [param, value]));

  return {
    query,
    species: params.species,
    sex: params.sex === 'MALE' || params.sex === 'FEMALE' ? params.sex : undefined,
    hospitalized: params.hospitalized === 'true' ? true : undefined,
  };
};

export default function Search() {
  const searchFilters = useSearchFilters({ filterDefinitions: FILTER_DEFINITIONS, initialRecentSearches: RECENT_SEARCHES });
  const { debouncedQuery, filters } = searchFilters;

  const patientsQuery = usePatientSearch(toPatientSearchParams(debouncedQuery, filters));
  const guardiansQuery = useGuardianSearch(debouncedQuery);
  // Filters describe pets (species, sex, hospitalization), so guardians only appear in unfiltered searches
  const guardians = filters.length === 0 ? (guardiansQuery.data ?? []) : [];
  const resultCount = (patientsQuery.data?.length ?? 0) + guardians.length;

  return (
    <>
      <PageHeading title="Busca Geral" subtitle="Localize pacientes, tutores, prontuários, chips e entre outros" />

      <div className={styles['search']}>
        <SearchFilters label="Buscar pacientes e tutores" {...searchFilters} />

        <section className={styles['search__results']} aria-labelledby="search-results-title" aria-busy={patientsQuery.isFetching}>
          <SectionHeader
            titleId="search-results-title"
            title="Resultados"
            size="lg"
            aside={patientsQuery.data && <Badge label={pluralize(resultCount, 'resultado', 'resultados')} tone="dark" mono />}
          />

          <QueryState query={patientsQuery} loadingLabel="Buscando…">
            {(patients) => (
              <>
                {resultCount === 0 && (
                  <p className={styles['search__results__empty']}>
                    {debouncedQuery ? `Nenhum resultado para “${debouncedQuery}”.` : 'Nenhum resultado com os filtros aplicados.'}
                  </p>
                )}
                {patients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
                {guardians.map((guardian) => (
                  <GuardianCard key={guardian.id} guardian={guardian} />
                ))}
              </>
            )}
          </QueryState>
        </section>
      </div>
    </>
  );
}
