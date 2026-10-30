import { useId } from 'react';

import { TransferKennelForm } from '@/components/forms/transfer-kennel-form/TransferKennelForm';
import { Button, Modal } from '@/components/ui';
import { useKennels, useTransferKennel } from '@/hooks/queries/useHospitalizationMutations';
import type { PatientActiveHospitalization } from '@/interfaces/patient.types';
import { toKennelOptions } from '@/utils/toKennelOptions';

type TransferKennelModalProps = {
  patientName: string;
  hospitalization: PatientActiveHospitalization;
  onClose: () => void;
};

export function TransferKennelModal({ patientName, hospitalization, onClose }: TransferKennelModalProps) {
  const formId = useId();
  const transferKennel = useTransferKennel();
  const kennelsQuery = useKennels();

  return (
    <Modal
      title="Transferir de Baia"
      description={`${patientName} está em ${hospitalization.kennel?.name ?? 'baia não informada'}. As tarefas pendentes acompanham o paciente.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={transferKennel.isPending || kennelsQuery.isPending}>
            {transferKennel.isPending ? 'Transferindo…' : 'Confirmar transferência'}
          </Button>
        </>
      }
    >
      <TransferKennelForm
        formId={formId}
        kennelOptions={toKennelOptions(kennelsQuery.data ?? [], hospitalization.kennel?.id)}
        onSubmit={(payload) => transferKennel.mutate({ hospitalizationId: hospitalization.id, payload }, { onSuccess: onClose })}
      />
    </Modal>
  );
}
