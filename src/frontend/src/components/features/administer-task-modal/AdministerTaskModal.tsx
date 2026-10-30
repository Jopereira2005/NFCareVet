import { useId } from 'react';
import clsx from 'clsx';
import { Ban, Clock, Info, MapPin, Pill, TriangleAlert, UtensilsCrossed } from 'lucide-react';

import { AdministerTaskForm } from '@/components/forms/administer-task-form/AdministerTaskForm';
import { Badge, Button, Modal } from '@/components/ui';
import { ADMINISTRATION_ROUTE_LABEL, PRESCRIPTION_ITEM_TYPE } from '@/constants/prescription.constants';
import { useApplyTask } from '@/hooks/queries/useTaskMutations';
import type { IconComponent } from '@/interfaces/icon.types';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { formatTime } from '@/utils/formatRelativeDay';
import { getPatientObservations, splitList, type ObservationType } from '@/utils/getPatientObservations';
import { normalizeText } from '@/utils/normalizeText';

import styles from './administer-task-modal.module.scss';

const OBSERVATION_ICON: Record<ObservationType, IconComponent> = { allergy: Ban, treatment: Pill, behavior: Info };

type AdministerTaskModalProps = {
  entry: PendingScheduleItem;
  onClose: () => void;
};

/** Registers that a scheduled task was done at the bedside; it then becomes a completed activity. */
export function AdministerTaskModal({ entry, onClose }: AdministerTaskModalProps) {
  const formId = useId();
  const applyTask = useApplyTask();
  const { item, patient, kennel, isOverdue, minutesOverdue } = entry;
  const { label: typeLabel, icon: TypeIcon } = PRESCRIPTION_ITEM_TYPE[item.itemType];

  const observations = getPatientObservations(patient);
  // The item being given matches a registered allergy (e.g. "Dipirona 500mg" for a patient allergic to Dipirona)
  const conflictingAllergy = splitList(patient.allergies).find((allergy) => normalizeText(item.title).includes(normalizeText(allergy)));
  const dosageLine = [item.dosage, item.route && ADMINISTRATION_ROUTE_LABEL[item.route]].filter(Boolean).join(' • ');

  return (
    <Modal
      title="Administrar Tarefa"
      description={`${patient.name} • ${kennel.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={applyTask.isPending}>
            {applyTask.isPending ? 'Registrando…' : 'Confirmar administração'}
          </Button>
        </>
      }
    >
      {conflictingAllergy && (
        <p className={styles['administer-task-modal__conflict']} role="alert">
          <TriangleAlert aria-hidden="true" />
          Atenção: {patient.name} tem alergia registrada a {conflictingAllergy}. Confirme com o veterinário antes de administrar.
        </p>
      )}

      <section className={styles['administer-task-modal__summary']} aria-label="Resumo da tarefa">
        <div className={styles['administer-task-modal__summary__header']}>
          <span className={styles['administer-task-modal__header__icon']}>
            <TypeIcon aria-hidden="true" />
          </span>
          <div className={styles['administer-task-modal__header__texts']}>
            <span className={styles['administer-task-modal__texts__type']}>{typeLabel}</span>
            <h3 className={styles['administer-task-modal__texts__title']}>{item.title}</h3>
            {dosageLine && <p className={styles['administer-task-modal__texts__dosage']}>{dosageLine}</p>}
          </div>
        </div>
        <ul className={styles['administer-task-modal__summary__meta']}>
          <li>
            <Clock aria-hidden="true" />
            <time dateTime={String(item.scheduledTime)}>{formatTime(item.scheduledTime)}</time>
            {isOverdue && <Badge label={minutesOverdue ? `Atrasada ${minutesOverdue} min` : 'Atrasada'} tone="danger" />}
          </li>
          <li>
            <MapPin aria-hidden="true" />
            {kennel.name}
          </li>
        </ul>
        {item.instructions && <p className={styles['administer-task-modal__summary__instructions']}>{item.instructions}</p>}
      </section>

      {(observations.length > 0 || patient.isFasting) && (
        <ul className={styles['administer-task-modal__alerts']} aria-label="Alertas do paciente">
          {patient.isFasting && (
            <li className={clsx(styles['administer-task-modal__alerts__item'], styles['administer-task-modal__alerts__item--fasting'])}>
              <UtensilsCrossed aria-hidden="true" />
              Em jejum
            </li>
          )}
          {observations.map(({ type, label }) => {
            const Icon = OBSERVATION_ICON[type];
            return (
              <li key={`${type}-${label}`} className={clsx(styles['administer-task-modal__alerts__item'], styles[`administer-task-modal__alerts__item--${type}`])}>
                <Icon aria-hidden="true" />
                {label}
              </li>
            );
          })}
        </ul>
      )}

      <AdministerTaskForm
        formId={formId}
        itemType={item.itemType}
        onSubmit={(payload) => applyTask.mutate({ entry, payload }, { onSuccess: onClose })}
      />
    </Modal>
  );
}
