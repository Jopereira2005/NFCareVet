import { useId, useState } from 'react';
import { useNavigate } from 'react-router';

import { PatientPhotoUploader } from '@/components/features/patient-photo-uploader/PatientPhotoUploader';
import { PatientForm } from '@/components/forms/patient-form/PatientForm';
import { toCreatePatientPayload } from '@/components/forms/patient-form/patient-form.schema';
import { Button, Modal } from '@/components/ui';
import { useGuardianSearch } from '@/hooks/queries/useGuardianQueries';
import { useCreatePatient } from '@/hooks/queries/usePatientMutations';
import { usePatientPhotoUpload } from '@/hooks/usePatientPhotoUpload';
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
  const { uploadPhoto, step, progress, isUploading } = usePatientPhotoUpload();
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [createdGuardianId, setCreatedGuardianId] = useState<string>();
  // The selector only needs the list when no guardian came from the caller
  const guardiansQuery = useGuardianSearch('');
  const guardianOptions = (guardiansQuery.data ?? []).map(({ id, name }) => ({ value: id, label: name }));

  const isBusy = createPatient.isPending || isUploading;

  return (
    <>
      <Modal
        title={guardian ? 'Vincular Pet' : 'Novo Paciente'}
        description={guardian ? `Cadastre um pet para ${guardian.name}.` : 'Cadastre o pet e vincule-o ao tutor responsável.'}
        onClose={onClose}
        footer={
          <>
            <Button variant="outlined" onClick={onClose} disabled={isBusy}>
              Cancelar
            </Button>
            <Button type="submit" form={formId} disabled={isBusy}>
              {isUploading ? 'Enviando foto…' : createPatient.isPending ? 'Salvando…' : 'Cadastrar pet'}
            </Button>
          </>
        }
      >
        <PatientPhotoUploader
          mode="staged"
          stagedFile={stagedFile}
          onStagedFileChange={setStagedFile}
          step={step}
          progress={progress}
          disabled={createPatient.isPending}
        />

        <PatientForm
          formId={formId}
          fixedGuardian={guardian}
          guardianOptions={guardianOptions}
          createdGuardianId={createdGuardianId}
          onRequestNewGuardian={guardian ? undefined : () => setIsGuardianModalOpen(true)}
          onSubmit={(values) =>
            createPatient.mutate(toCreatePatientPayload(values), {
              onSuccess: async (patient) => {
                if (stagedFile) {
                  await uploadPhoto(stagedFile, patient.id);
                }
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
