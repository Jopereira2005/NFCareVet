import { useId } from 'react';

import { GuardianForm } from '@/components/forms/guardian-form/GuardianForm';
import { toGuardianFormValues, toUpdateGuardianPayload } from '@/components/forms/guardian-form/guardian-form.schema';
import { Button, Modal } from '@/components/ui';
import { useUpdateGuardian } from '@/hooks/queries/useGuardianMutations';
import type { Guardian } from '@/interfaces/guardian.types';

type EditGuardianModalProps = {
  guardian: Guardian;
  onClose: () => void;
};

export function EditGuardianModal({ guardian, onClose }: EditGuardianModalProps) {
  const formId = useId();
  const updateGuardian = useUpdateGuardian();

  return (
    <Modal
      title="Editar Tutor"
      description="Mantenha os contatos atualizados: são eles que a equipe usa em emergências."
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={updateGuardian.isPending}>
            {updateGuardian.isPending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </>
      }
    >
      <GuardianForm
        formId={formId}
        defaultValues={toGuardianFormValues(guardian)}
        onSubmit={(values) => updateGuardian.mutate({ guardianId: guardian.id, payload: toUpdateGuardianPayload(values) }, { onSuccess: onClose })}
      />
    </Modal>
  );
}
