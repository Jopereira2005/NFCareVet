import { TaskCard } from '@/components/ui/task-card/TaskCard';
import { PRESCRIPTION_ITEM_TYPE } from '@/constants/prescription.constants';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { formatTime } from '@/utils/formatRelativeDay';
import { getTaskPriority } from '@/utils/getTaskPriority';

type ScheduleTaskCardProps = {
  entry: PendingScheduleItem;
  /** Shows the patient name before the instructions, for queues with several patients. */
  showPatient?: boolean;
  onEdit?: () => void;
  onAdminister?: () => void;
};

/** TaskCard fed by an item of the nursing schedule (GET /prescriptions/schedule/pending). */
export function ScheduleTaskCard({ entry, showPatient = false, onEdit, onAdminister }: ScheduleTaskCardProps) {
  const { item, kennel, patient, assignee } = entry;
  const details = item.instructions ?? item.dosage ?? '';

  return (
    <TaskCard
      title={item.title}
      description={showPatient ? `${patient.name} • ${details}` : details}
      time={formatTime(item.scheduledTime)}
      location={kennel.name}
      assignee={assignee?.name}
      priority={getTaskPriority(entry)}
      icon={PRESCRIPTION_ITEM_TYPE[item.itemType].icon}
      onEdit={onEdit}
      onAdminister={onAdminister}
    />
  );
}
