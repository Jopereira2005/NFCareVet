import { useId } from 'react';

import { AdmitPatientForm } from '@/components/forms/admit-patient-form/AdmitPatientForm';
import { toAdmitPatientPayload } from '@/components/forms/admit-patient-form/admit-patient-form.schema';
import { Button, Modal } from '@/components/ui';
import { useAdmitPatient, useKennels } from '@/hooks/queries/useHospitalizationMutations';
import type { Patient } from '@/interfaces/patient.types';
import { toKennelOptions } from '@/utils/toKennelOptions';

type AdmitPatientModalProps = {
  patient: Patient;
  onClose: () => void;
};

export function AdmitPatientModal({ patient, onClose }: AdmitPatientModalProps) {
  const formId = useId();
  const admitPatient = useAdmitPatient();
  const kennelsQuery = useKennels();

  return (
    <Modal
      title="Internar Paciente"
      description={`${patient.name} vai para uma baia e passa a receber tarefas do plantão.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={admitPatient.isPending || kennelsQuery.isPending}>
            {admitPatient.isPending ? 'Internando…' : 'Confirmar internação'}
          </Button>
        </>
      }
    >
      <AdmitPatientForm
        formId={formId}
        kennelOptions={toKennelOptions(kennelsQuery.data ?? [])}
        currentTagCode={patient.nfcTag?.publicCode}
        onSubmit={(values) => admitPatient.mutate(toAdmitPatientPayload(patient.id, values), { onSuccess: onClose })}
      />
    </Modal>
  );
}
