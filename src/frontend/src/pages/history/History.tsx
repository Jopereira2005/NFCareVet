import { Clock, User } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import { PatientCard, PeriodSelector, type PeriodOption } from '@/components/features';
import { SearchFilters } from '@/components/forms';
import { PageHeading, SectionHeader } from '@/components/layout';
import { Badge, QueryState } from '@/components/ui';
import { useTemporalSummary } from '@/hooks/queries/useDashboardQueries';
import { usePatientVisits } from '@/hooks/queries/usePatientQueries';
import { useSearchFilters, type RecentSearchOption } from '@/hooks/useSearchFilters';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import type { HistoryPeriod } from '@/interfaces/hospitalization.types';
import { formatTime } from '@/utils/formatRelativeDay';
import { normalizeText } from '@/utils/normalizeText';
import { pluralize } from '@/utils/pluralize';

import styles from './history.module.scss';

const RECENT_SEARCHES: RecentSearchOption[] = [
  { id: 'thor', label: 'Thor', query: 'Thor', icon: PawIcon },
  { id: 'lucas', label: 'Lucas Silva', query: 'Lucas Silva', icon: User },
];

const HISTORY_PERIODS = ['today', 'week', 'month'] as const;

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();

const formatVisitTime = (visitedAt: string) =>
  isToday(visitedAt)
    ? formatTime(visitedAt)
    : new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(visitedAt));

export default function History() {
  const [period, setPeriod] = useSearchParamState<HistoryPeriod>('period', 'today', HISTORY_PERIODS);
  const { query, onQueryChange, recentSearches, onRecentSelect, onClearRecent, debouncedQuery } = useSearchFilters({
    initialRecentSearches: RECENT_SEARCHES,
  });
  const summaryQuery = useTemporalSummary();
  const visitsQuery = usePatientVisits(period);

  const periods: PeriodOption[] = [
    { period: 'today', label: 'Hoje', total: summaryQuery.data?.today.admittedCount },
    { period: 'week', label: 'Semana', total: summaryQuery.data?.thisWeek.admittedCount },
    { period: 'month', label: 'Mês', total: summaryQuery.data?.thisMonth.admittedCount },
  ];

  const term = normalizeText(debouncedQuery);
  const visits = (visitsQuery.data ?? []).filter(({ patient }) =>
    [patient.name, patient.guardian?.name ?? '', patient.nfcTag?.publicCode ?? ''].some((value) => normalizeText(value).includes(term)),
  );

  return (
    <>
      <PageHeading title="Histórico de Pacientes" subtitle="Localize pacientes, tutores, prontuários, chips e entre outros" />

      <div className={styles['history']}>
        <SearchFilters
          label="Buscar no histórico"
          query={query}
          onQueryChange={onQueryChange}
          recentSearches={recentSearches}
          onRecentSelect={onRecentSelect}
          onClearRecent={onClearRecent}
        />

        <PeriodSelector periods={periods} value={period} onChange={setPeriod} />

        <section className={styles['history__results']} aria-labelledby="history-results-title" aria-busy={visitsQuery.isFetching}>
          <SectionHeader
            titleId="history-results-title"
            title="Resultados"
            size="lg"
            aside={visitsQuery.data && <Badge label={pluralize(visits.length, 'resultado', 'resultados')} tone="dark" mono />}
          />

          <QueryState query={visitsQuery} loadingLabel="Carregando atendimentos…">
            {() =>
              visits.length === 0 ? (
                <p className={styles['history__results__empty']}>Nenhum atendimento neste período.</p>
              ) : (
                visits.map(({ id, patient, visitedAt }) => (
                  <PatientCard
                    key={id}
                    patient={patient}
                    aside={
                      <span className={styles['history__results__time']}>
                        <Clock aria-hidden="true" />
                        <time dateTime={visitedAt}>{formatVisitTime(visitedAt)}</time>
                      </span>
                    }
                  />
                ))
              )
            }
          </QueryState>
        </section>
      </div>
    </>
  );
}
