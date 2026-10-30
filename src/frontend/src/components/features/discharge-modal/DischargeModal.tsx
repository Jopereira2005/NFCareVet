import { useId, useState } from 'react';
import { DischargeReason } from '@nfcarevet/common';
import { TriangleAlert } from 'lucide-react';

import { DischargeForm } from '@/components/forms/discharge-form/DischargeForm';
import { Button, Modal } from '@/components/ui';
import { useDischargePatient } from '@/hooks/queries/useHospitalizationMutations';
import type { PatientActiveHospitalization } from '@/interfaces/patient.types';
import { pluralize } from '@/utils/pluralize';

import styles from './discharge-modal.module.scss';

type DischargeModalProps = {
  patientName: string;
  hospitalization: PatientActiveHospitalization;
  /** Tasks still in the queue for this hospitalization; they leave it with the discharge. */
  pendingTaskCount: number;
  onClose: () => void;
};

export function DischargeModal({ patientName, hospitalization, pendingTaskCount, onClose }: DischargeModalProps) {
  const formId = useId();
  const dischargePatient = useDischargePatient();
  const [reason, setReason] = useState<DischargeReason>(DischargeReason.MEDICAL_DISCHARGE);
  const isDeceased = reason === DischargeReason.DECEASED;

  return (
    <Modal
      title="Encerrar Internação"
      description={`Registra a saída de ${patientName} e libera ${hospitalization.kennel?.name ?? 'a baia'}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="danger" disabled={dischargePatient.isPending}>
            {dischargePatient.isPending ? 'Registrando…' : isDeceased ? 'Registrar óbito' : 'Confirmar alta'}
          </Button>
        </>
      }
    >
      {pendingTaskCount > 0 && (
        <p className={styles['discharge-modal__warning']} role="alert">
          <TriangleAlert aria-hidden="true" />
          {pluralize(pendingTaskCount, 'tarefa pendente sairá', 'tarefas pendentes sairão')} da fila do plantão.
        </p>
      )}
      <DischargeForm
        formId={formId}
        onReasonChange={setReason}
        onSubmit={(payload) => dischargePatient.mutate({ hospitalizationId: hospitalization.id, payload }, { onSuccess: onClose })}
      />
    </Modal>
  );
}
