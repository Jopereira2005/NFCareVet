import { useId } from 'react';
import { EventType } from '@nfcarevet/common';

import { ClinicalEventForm } from '@/components/forms/clinical-event-form/ClinicalEventForm';
import {
  toClinicalEventFormValues,
  toUpdateClinicalEventPayload,
} from '@/components/forms/clinical-event-form/clinical-event-form.schema';
import { Button, Modal } from '@/components/ui';
import { useUpdateClinicalEvent } from '@/hooks/queries/useTaskMutations';
import type { TimelineEvent } from '@/interfaces/clinical-event.types';

type ClinicalEventModalProps = {
  event: TimelineEvent;
  onClose: () => void;
};

/** Corrects a completed activity (typo in a measurement, wrong time) without creating a new record. */
export function ClinicalEventModal({ event, onClose }: ClinicalEventModalProps) {
  const formId = useId();
  const updateEvent = useUpdateClinicalEvent();

  return (
    <Modal
      title="Editar Registro"
      description={`Registrado por ${event.executor.name}${event.patient ? ` • ${event.patient.name}` : ''}. A correção fica no histórico.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={updateEvent.isPending}>
            {updateEvent.isPending ? 'Salvando…' : 'Salvar correção'}
          </Button>
        </>
      }
    >
      <ClinicalEventForm
        formId={formId}
        defaultValues={toClinicalEventFormValues(event)}
        isVitalSigns={event.eventType === EventType.VITAL_SIGNS}
        onSubmit={(values) =>
          updateEvent.mutate({ eventId: event.id, payload: toUpdateClinicalEventPayload(values, event) }, { onSuccess: onClose })
        }
      />
    </Modal>
  );
}
