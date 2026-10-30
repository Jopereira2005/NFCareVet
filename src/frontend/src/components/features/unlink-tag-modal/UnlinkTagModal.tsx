import { useId } from 'react';
import { Link } from 'react-router';

import { UnlinkTagForm } from '@/components/forms/unlink-tag-form/UnlinkTagForm';
import { Button, Modal } from '@/components/ui';
import { useUnlinkTag } from '@/hooks/queries/useHospitalizationMutations';
import type { Patient } from '@/interfaces/patient.types';
import { getPatientRecordPath } from '@/router/paths';

import styles from './unlink-tag-modal.module.scss';

type UnlinkTagModalProps = {
  /** Patient currently wearing the tag that was read. */
  patient: Patient;
  onClose: () => void;
};

/** A collar that is already in use was read in link mode: show who wears it and allow freeing it. */
export function UnlinkTagModal({ patient, onClose }: UnlinkTagModalProps) {
  const formId = useId();
  const unlinkTag = useUnlinkTag();
  const hospitalization = patient.activeHospitalization;

  return (
    <Modal
      title="Tag em uso"
      description={`A tag #${patient.nfcTag?.publicCode ?? ''} está vinculada a ${patient.name}.`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Manter vínculo
          </Button>
          {hospitalization && (
            <Button type="submit" form={formId} variant="danger" disabled={unlinkTag.isPending}>
              {unlinkTag.isPending ? 'Liberando…' : 'Liberar tag'}
            </Button>
          )}
        </>
      }
    >
      <p className={styles['unlink-tag-modal__info']}>
        Ao liberar, a coleira deixa de abrir o prontuário de {patient.name} e pode ser vinculada a outro paciente.{' '}
        <Link to={getPatientRecordPath(patient.id)} onClick={onClose}>
          Ver prontuário
        </Link>
      </p>
      {hospitalization ? (
        <UnlinkTagForm
          formId={formId}
          onSubmit={(payload) => unlinkTag.mutate({ hospitalizationId: hospitalization.id, payload }, { onSuccess: onClose })}
        />
      ) : (
        <p className={styles['unlink-tag-modal__info']}>{patient.name} não está internado; a tag só pode ser liberada durante uma internação.</p>
      )}
    </Modal>
  );
}
