import { useId, useState } from 'react';
import { useNavigate } from 'react-router';

import { PatientForm } from '@/components/forms/patient-form/PatientForm';
import { toCreatePatientPayload } from '@/components/forms/patient-form/patient-form.schema';
import { Button, Modal } from '@/components/ui';
import { useGuardianSearch } from '@/hooks/queries/useGuardianQueries';
import { useCreatePatient } from '@/hooks/queries/usePatientMutations';
import { getPatientRecordPath } from '@/router/paths';

import { NewGuardianModal } from '../new-guardian-modal/NewGuardianModal';

type NewPatientModalProps = {
  onClose: () => void;
  /** Opened from a guardian's profile: the pet is linked to them and the selector is hidden. */
  guardian?: { id: string; name: string };
};

export function NewPatientModal({ onClose, guardian }: NewPatientModalProps) {
  const formId = useId();
  const navigate = useNavigate();
  const createPatient = useCreatePatient();
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [createdGuardianId, setCreatedGuardianId] = useState<string>();
  // The selector only needs the list when no guardian came from the caller
  const guardiansQuery = useGuardianSearch('');
  const guardianOptions = (guardiansQuery.data ?? []).map(({ id, name }) => ({ value: id, label: name }));

  return (
    <>
      <Modal
        title={guardian ? 'Vincular Pet' : 'Novo Paciente'}
        description={guardian ? `Cadastre um pet para ${guardian.name}.` : 'Cadastre o pet e vincule-o ao tutor responsável.'}
        onClose={onClose}
        footer={
          <>
            <Button variant="outlined" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={createPatient.isPending}>
              {createPatient.isPending ? 'Salvando…' : 'Cadastrar pet'}
            </Button>
          </>
        }
      >
        <PatientForm
          formId={formId}
          fixedGuardian={guardian}
          guardianOptions={guardianOptions}
          createdGuardianId={createdGuardianId}
          onRequestNewGuardian={guardian ? undefined : () => setIsGuardianModalOpen(true)}
          onSubmit={(values) =>
            createPatient.mutate(toCreatePatientPayload(values), {
              onSuccess: (patient) => {
                onClose();
                navigate(getPatientRecordPath(patient.id));
              },
            })
          }
        />
      </Modal>

      {/* Stacks on top (native top layer) and returns the new guardian to the patient form */}
      {isGuardianModalOpen && (
        <NewGuardianModal onClose={() => setIsGuardianModalOpen(false)} onCreated={({ id }) => setCreatedGuardianId(id)} />
      )}
    </>
  );
}
