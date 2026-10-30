import { useId, useState } from 'react';
import { Ban } from 'lucide-react';

import { CancelTaskForm } from '@/components/forms/cancel-task-form/CancelTaskForm';
import { TaskForm } from '@/components/forms/task-form/TaskForm';
import { getTaskFormDefaults, toPrescriptionItemPayload, toTaskFormValues } from '@/components/forms/task-form/task-form.schema';
import { Button, Modal } from '@/components/ui';
import { usePatientSearch } from '@/hooks/queries/usePatientQueries';
import { useCancelTask, useCreateTask, useUpdateTask } from '@/hooks/queries/useTaskMutations';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';

import styles from './task-modal.module.scss';

type TaskModalProps =
  | {
      mode: 'create';
      /** Opened from a patient's record: the task goes to this hospitalization. */
      patient?: { name: string; hospitalizationId: string };
      onClose: () => void;
    }
  | { mode: 'edit'; entry: PendingScheduleItem; onClose: () => void };

export function TaskModal(props: TaskModalProps) {
  const { mode, onClose } = props;
  const formId = useId();
  const [isCancelling, setIsCancelling] = useState(false);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const cancelTask = useCancelTask();

  const fixedPatient =
    props.mode === 'edit' ? { name: props.entry.patient.name, hospitalizationId: props.entry.hospitalizationId } : props.patient;
  // Only hospitalized patients can receive tasks (they hang on a hospitalization)
  const hospitalizedQuery = usePatientSearch({ hospitalized: true });
  const patientOptions = (hospitalizedQuery.data ?? []).flatMap(({ name, breed, species, activeHospitalization }) =>
    activeHospitalization ? [{ value: activeHospitalization.id, label: `${name} • ${breed ?? species}` }] : [],
  );

  const isSaving = createTask.isPending || updateTask.isPending;

  return (
    <Modal
      title={mode === 'create' ? 'Nova Atividade' : 'Editar Atividade'}
      description={
        mode === 'create' ? 'Agende uma medicação, procedimento, exame ou aferição.' : 'Ajuste o horário, a dose ou as instruções da tarefa.'
      }
      onClose={onClose}
      footer={
        !isCancelling && (
          <>
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={isSaving}>
              {isSaving ? 'Salvando…' : mode === 'create' ? 'Criar tarefa' : 'Salvar alterações'}
            </Button>
          </>
        )
      }
    >
      {isCancelling && props.mode === 'edit' ? (
        <CancelTaskForm
          isSubmitting={cancelTask.isPending}
          onBack={() => setIsCancelling(false)}
          onSubmit={(payload) => cancelTask.mutate({ itemId: props.entry.item.id, payload }, { onSuccess: onClose })}
        />
      ) : (
        <>
          <TaskForm
            formId={formId}
            defaultValues={props.mode === 'edit' ? toTaskFormValues(props.entry) : getTaskFormDefaults(fixedPatient?.hospitalizationId)}
            fixedPatientName={fixedPatient?.name}
            patientOptions={patientOptions}
            onSubmit={(values) => {
              const item = toPrescriptionItemPayload(values);
              if (props.mode === 'edit') {
                updateTask.mutate({ itemId: props.entry.item.id, payload: item }, { onSuccess: onClose });
              } else {
                createTask.mutate({ hospitalizationId: values.hospitalizationId, item }, { onSuccess: onClose });
              }
            }}
          />
          {mode === 'edit' && (
            <button type="button" className={styles['task-modal__cancel-task']} onClick={() => setIsCancelling(true)}>
              <Ban aria-hidden="true" />
              Cancelar esta tarefa
            </button>
          )}
        </>
      )}
    </Modal>
  );
}
