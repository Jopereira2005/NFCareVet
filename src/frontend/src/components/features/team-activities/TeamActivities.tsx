import { useState } from 'react';
import { ClipboardClock, Plus, TriangleAlert, UserRound } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import { SearchFilters } from '@/components/forms';
import { SectionHeader } from '@/components/layout';
import { Badge, FloatingActionButton, QueryState } from '@/components/ui';
import { usePendingSchedule } from '@/hooks/queries/useTaskQueries';
import { useSearchFilters, type FilterDefinition, type RecentSearchOption } from '@/hooks/useSearchFilters';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { getTaskPriority } from '@/utils/getTaskPriority';
import { normalizeText } from '@/utils/normalizeText';
import { pluralize } from '@/utils/pluralize';

import { AdministerTaskModal } from '../administer-task-modal/AdministerTaskModal';
import { ScheduleTaskCard } from '../schedule-task-card/ScheduleTaskCard';
import { TaskModal } from '../task-modal/TaskModal';

import styles from './team-activities.module.scss';

type ScheduleFilter = FilterDefinition & { matches: (entry: PendingScheduleItem) => boolean };

const FILTER_DEFINITIONS: ScheduleFilter[] = [
  { id: 'canine', group: 'Espécie', label: 'Cachorro', icon: PawIcon, tone: 'info', param: 'species', value: 'Canina', matches: ({ patient }) => patient.species === 'Canina' },
  { id: 'feline', group: 'Espécie', label: 'Gato', icon: PawIcon, tone: 'info', param: 'species', value: 'Felina', matches: ({ patient }) => patient.species === 'Felina' },
  { id: 'high', group: 'Prioridade', label: 'Alta', icon: TriangleAlert, tone: 'danger', param: 'priority', value: 'high', matches: (entry) => getTaskPriority(entry) === 'high' },
  { id: 'medium', group: 'Prioridade', label: 'Média', icon: TriangleAlert, tone: 'warning', param: 'priority', value: 'medium', matches: (entry) => getTaskPriority(entry) === 'medium' },
  { id: 'low', group: 'Prioridade', label: 'Baixa', icon: TriangleAlert, tone: 'info', param: 'priority', value: 'low', matches: (entry) => getTaskPriority(entry) === 'low' },
];

const RECENT_SEARCHES: RecentSearchOption[] = [{ id: 'paxe', label: 'Dr: Mr Paxe', query: 'Mr Paxe', icon: UserRound }];

const matchesQuery = ({ item, patient, kennel, assignee }: PendingScheduleItem, query: string) =>
  [item.title, item.instructions ?? '', patient.name, kennel.name, assignee?.name ?? ''].some((value) =>
    normalizeText(value).includes(query),
  );

/**
 * "Atividades Gerais" tab: the whole team's queue. The schedule endpoint has no text search,
 * so the shift's queue (a few dozen items) is filtered on the client.
 */
export function TeamActivities() {
  const searchFilters = useSearchFilters({ filterDefinitions: FILTER_DEFINITIONS, initialRecentSearches: RECENT_SEARCHES });
  const { debouncedQuery, filters } = searchFilters;
  const scheduleQuery = usePendingSchedule();
  const [taskModal, setTaskModal] = useState<{ mode: 'create' } | { mode: 'edit'; entry: PendingScheduleItem } | null>(null);
  const [administeringTask, setAdministeringTask] = useState<PendingScheduleItem | null>(null);

  // Memoized by the React Compiler; no manual useMemo needed
  const query = normalizeText(debouncedQuery);
  const tasks = (scheduleQuery.data ?? []).filter((entry) => matchesQuery(entry, query) && filters.every((filter) => filter.matches(entry)));

  return (
    <div className={styles['team-activities']}>
      <SearchFilters label="Buscar atividades" {...searchFilters} />

      <section className={styles['team-activities__section']} aria-labelledby="team-pending-title">
        <SectionHeader
          titleId="team-pending-title"
          title="Atividades"
          icon={ClipboardClock}
          aside={scheduleQuery.data && <Badge label={pluralize(tasks.length, 'pendente', 'pendentes')} tone="dark" mono />}
        />
        <QueryState query={scheduleQuery} loadingLabel="Carregando atividades…">
          {() =>
            tasks.length === 0 ? (
              <p className={styles['team-activities__section__empty']}>Nenhuma atividade encontrada.</p>
            ) : (
              tasks.map((entry) => (
                <ScheduleTaskCard
                  key={entry.item.id}
                  entry={entry}
                  showPatient
                  onEdit={() => setTaskModal({ mode: 'edit', entry })}
                  onAdminister={() => setAdministeringTask(entry)}
                />
              ))
            )
          }
        </QueryState>
      </section>

      <FloatingActionButton label="Nova Atividade" icon={Plus} onClick={() => setTaskModal({ mode: 'create' })} />

      {taskModal && <TaskModal {...taskModal} onClose={() => setTaskModal(null)} />}
      {administeringTask && <AdministerTaskModal entry={administeringTask} onClose={() => setAdministeringTask(null)} />}
    </div>
  );
}
