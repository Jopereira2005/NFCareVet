import { useId } from 'react';
import { Nfc } from 'lucide-react';

import { LinkTagForm } from '@/components/forms/link-tag-form/LinkTagForm';
import { Button, Modal } from '@/components/ui';
import { useLinkTag } from '@/hooks/queries/useHospitalizationMutations';
import { usePatientSearch } from '@/hooks/queries/usePatientQueries';

import styles from './link-tag-modal.module.scss';

type LinkTagModalProps = {
  /** UID read from the collar. */
  tagUid: string;
  onClose: () => void;
};

/** Links a free NFC collar to a hospitalized patient (the tag belongs to the hospitalization). */
export function LinkTagModal({ tagUid, onClose }: LinkTagModalProps) {
  const formId = useId();
  const linkTag = useLinkTag();
  const hospitalizedQuery = usePatientSearch({ hospitalized: true });
  const patientOptions = (hospitalizedQuery.data ?? []).flatMap(({ name, activeHospitalization, nfcTag }) =>
    activeHospitalization
      ? [
          {
            value: activeHospitalization.id,
            label: nfcTag ? `${name} — já usa #${nfcTag.publicCode}` : `${name} • ${activeHospitalization.kennel?.name ?? 'sem baia'}`,
            disabled: Boolean(nfcTag),
          },
        ]
      : [],
  );

  return (
    <Modal
      title="Vincular Tag"
      description="Tag livre detectada. Escolha o paciente que vai usar a coleira."
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={linkTag.isPending || hospitalizedQuery.isPending}>
            {linkTag.isPending ? 'Vinculando…' : 'Vincular tag'}
          </Button>
        </>
      }
    >
      <p className={styles['link-tag-modal__tag']}>
        <span className={styles['link-tag-modal__tag__icon']}>
          <Nfc aria-hidden="true" />
        </span>
        <span>
          <span className={styles['link-tag-modal__tag__label']}>UID da tag</span>
          <strong className={styles['link-tag-modal__tag__uid']}>{tagUid}</strong>
        </span>
      </p>
      <LinkTagForm
        formId={formId}
        patientOptions={patientOptions}
        onSubmit={(hospitalizationId) => linkTag.mutate({ hospitalizationId, payload: { tagIdentifier: tagUid } }, { onSuccess: onClose })}
      />
    </Modal>
  );
}
