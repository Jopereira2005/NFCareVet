import { useState } from 'react';
import { CircleCheck, ClipboardClock } from 'lucide-react';

import { SectionHeader } from '@/components/layout';
import { Badge, QueryState } from '@/components/ui';
import { useMyRecentClinicalEvents, usePendingSchedule } from '@/hooks/queries/useTaskQueries';
import type { TimelineEvent } from '@/interfaces/clinical-event.types';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { pluralize } from '@/utils/pluralize';

import { AdministerTaskModal } from '../administer-task-modal/AdministerTaskModal';
import { ClinicalEventCard } from '../clinical-event-card/ClinicalEventCard';
import { ClinicalEventModal } from '../clinical-event-modal/ClinicalEventModal';
import { ScheduleTaskCard } from '../schedule-task-card/ScheduleTaskCard';
import { TaskModal } from '../task-modal/TaskModal';

import styles from './my-activities.module.scss';

/** "Suas Atividades" tab: the logged user's pending schedule and the events they registered. */
export function MyActivities() {
  const scheduleQuery = usePendingSchedule({ onlyMine: true });
  const eventsQuery = useMyRecentClinicalEvents();
  const [editingTask, setEditingTask] = useState<PendingScheduleItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [administeringTask, setAdministeringTask] = useState<PendingScheduleItem | null>(null);

  return (
    <div className={styles['my-activities']}>
      <section className={styles['my-activities__section']} aria-labelledby="my-pending-title">
        <SectionHeader
          titleId="my-pending-title"
          title="Atividades Pendentes"
          icon={ClipboardClock}
          aside={scheduleQuery.data && <Badge label={pluralize(scheduleQuery.data.length, 'pendente', 'pendentes')} tone="danger" mono />}
        />
        <QueryState query={scheduleQuery} loadingLabel="Carregando atividades…">
          {(schedule) =>
            schedule.length === 0 ? (
              <p className={styles['my-activities__section__empty']}>Nenhuma atividade pendente.</p>
            ) : (
              schedule.map((entry) => (
                <ScheduleTaskCard
                  key={entry.item.id}
                  entry={entry}
                  showPatient
                  onEdit={() => setEditingTask(entry)}
                  onAdminister={() => setAdministeringTask(entry)}
                />
              ))
            )
          }
        </QueryState>
      </section>

      <section className={styles['my-activities__section']} aria-labelledby="my-completed-title">
        <SectionHeader
          titleId="my-completed-title"
          title="Atividades Concluídas"
          icon={CircleCheck}
          aside={eventsQuery.data && <Badge label={pluralize(eventsQuery.data.length, 'concluída', 'concluídas')} tone="success" mono />}
        />
        <QueryState query={eventsQuery} loadingLabel="Carregando histórico…">
          {(events) => events.map((event) => <ClinicalEventCard key={event.id} event={event} onEdit={() => setEditingEvent(event)} />)}
        </QueryState>
      </section>

      {editingTask && <TaskModal mode="edit" entry={editingTask} onClose={() => setEditingTask(null)} />}
      {editingEvent && <ClinicalEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {administeringTask && <AdministerTaskModal entry={administeringTask} onClose={() => setAdministeringTask(null)} />}
    </div>
  );
}
