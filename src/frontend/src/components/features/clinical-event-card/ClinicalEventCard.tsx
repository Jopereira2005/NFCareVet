import { HistoryCard } from '@/components/ui/history-card/HistoryCard';
import type { TimelineEvent } from '@/interfaces/clinical-event.types';
import { formatClinicalMetrics } from '@/utils/formatClinicalMetrics';
import { formatRelativeDay, formatTime } from '@/utils/formatRelativeDay';

type ClinicalEventCardProps = {
  event: TimelineEvent;
  /** Hide on a single patient's timeline, where the name is redundant. */
  showPatient?: boolean;
  onEdit?: () => void;
};

/** HistoryCard fed by a clinical timeline event. */
export function ClinicalEventCard({ event, showPatient = true, onEdit }: ClinicalEventCardProps) {
  const { title, recordedAt, executor, prescribedBy, patient, metrics, description } = event;
  const relativeDate = formatRelativeDay(recordedAt);

  return (
    <HistoryCard
      title={title}
      time={formatTime(recordedAt)}
      professional={executor.name}
      patientName={showPatient ? patient?.name : undefined}
      details={formatClinicalMetrics(metrics) || description || 'Sem detalhes registrados.'}
      prescribedBy={prescribedBy?.name}
      performedBy={executor.name}
      dateLabel={`${relativeDate.charAt(0).toUpperCase()}${relativeDate.slice(1)}`}
      onEdit={onEdit}
    />
  );
}
