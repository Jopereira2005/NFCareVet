import { useId } from 'react';

import { GuardianForm } from '@/components/forms/guardian-form/GuardianForm';
import { toCreateGuardianPayload } from '@/components/forms/guardian-form/guardian-form.schema';
import { Button, Modal } from '@/components/ui';
import { useCreateGuardian } from '@/hooks/queries/useGuardianMutations';
import type { Guardian } from '@/interfaces/guardian.types';

type NewGuardianModalProps = {
  onClose: () => void;
  /** Called with the saved guardian, e.g. to select it in the patient form that opened this modal. */
  onCreated?: (guardian: Guardian) => void;
};

export function NewGuardianModal({ onClose, onCreated }: NewGuardianModalProps) {
  const formId = useId();
  const createGuardian = useCreateGuardian();

  return (
    <Modal
      title="Novo Tutor"
      description="Cadastre o responsável para vincular pets e prontuários."
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={createGuardian.isPending}>
            {createGuardian.isPending ? 'Salvando…' : 'Cadastrar tutor'}
          </Button>
        </>
      }
    >
      <GuardianForm
        formId={formId}
        onSubmit={(values) =>
          createGuardian.mutate(toCreateGuardianPayload(values), {
            onSuccess: (guardian) => {
              onCreated?.(guardian);
              onClose();
            },
          })
        }
      />
    </Modal>
  );
}
