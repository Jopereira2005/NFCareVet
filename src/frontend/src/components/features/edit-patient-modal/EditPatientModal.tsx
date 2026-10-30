import { useId } from 'react';

import { PatientForm } from '@/components/forms/patient-form/PatientForm';
import { toPatientFormValues, toUpdatePatientPayload } from '@/components/forms/patient-form/patient-form.schema';
import { Button, Modal } from '@/components/ui';
import { useUpdatePatient } from '@/hooks/queries/usePatientMutations';
import type { Patient } from '@/interfaces/patient.types';

type EditPatientModalProps = {
  patient: Patient;
  onClose: () => void;
};

export function EditPatientModal({ patient, onClose }: EditPatientModalProps) {
  const formId = useId();
  const updatePatient = useUpdatePatient();

  return (
    <Modal
      title="Editar Paciente"
      description={`Atualize os dados de ${patient.name}. Alergias e comportamento aparecem como alertas no prontuário.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={updatePatient.isPending}>
            {updatePatient.isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </>
      }
    >
      <PatientForm
        formId={formId}
        defaultValues={toPatientFormValues(patient)}
        // Changing the responsible guardian is a separate (and rarer) operation, so it stays read-only here
        fixedGuardian={{ id: patient.guardianId, name: patient.guardian?.name ?? 'Tutor não informado' }}
        onSubmit={(values) => updatePatient.mutate({ patientId: patient.id, payload: toUpdatePatientPayload(values) }, { onSuccess: onClose })}
      />
    </Modal>
  );
}
