import { zodResolver } from '@hookform/resolvers/zod';
import { Nfc, Stethoscope } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button/Button';
import { Input } from '@/components/ui/input/Input';
import { Select, type SelectOption } from '@/components/ui/select/Select';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { useNfcReader } from '@/hooks/useNfcReader';

import { ADMIT_PATIENT_DEFAULTS, admitPatientFormSchema, type AdmitPatientFormValues } from './admit-patient-form.schema';
import styles from './admit-patient-form.module.scss';

/** Used when the browser has no Web NFC (desktop development). */
const SIMULATED_TAG_SERIAL = '04:A1:B2:C3:D4:77:01';

type AdmitPatientFormProps = {
  formId: string;
  kennelOptions: SelectOption[];
  /** Tag already linked to the patient; when set, the tag field is not offered. */
  currentTagCode?: string;
  onSubmit: (values: AdmitPatientFormValues) => void;
};

export function AdmitPatientForm({ formId, kennelOptions, currentTagCode, onSubmit }: AdmitPatientFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdmitPatientFormValues>({ resolver: zodResolver(admitPatientFormSchema), defaultValues: ADMIT_PATIENT_DEFAULTS });

  // Reading the collar fills the field, so nobody types a 14-character UID by hand
  const tagReader = useNfcReader({ onRead: ({ uid }) => setValue('tagIdentifier', uid, { shouldValidate: true }) });
  const readTag = () => (tagReader.isSupported ? void tagReader.start() : tagReader.simulate(SIMULATED_TAG_SERIAL));
  const hasFreeKennel = kennelOptions.some(({ disabled }) => !disabled);

  return (
    <form id={formId} className={styles['admit-patient-form']} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Select
        id="admit-kennel"
        label="Baia"
        placeholder="Selecione a baia"
        options={kennelOptions}
        hint={hasFreeKennel ? undefined : 'Todas as baias estão ocupadas no momento.'}
        error={errors.kennelId?.message}
        {...register('kennelId')}
      />
      <Input
        id="admit-reason"
        label="Motivo da internação"
        placeholder="Ex.: Gastroenterite aguda com desidratação"
        leadingIcon={<Stethoscope />}
        error={errors.admissionReason?.message}
        {...register('admissionReason')}
      />
      <Textarea
        id="admit-diagnosis"
        label="Diagnóstico preliminar"
        placeholder="Ex.: Suspeita de corpo estranho linear"
        error={errors.preliminaryDiagnosis?.message}
        {...register('preliminaryDiagnosis')}
      />

      {currentTagCode ? (
        <p className={styles['admit-patient-form__tag']}>
          <Nfc aria-hidden="true" />
          Tag vinculada: <strong>#{currentTagCode}</strong>
        </p>
      ) : (
        <Input
          id="admit-tag"
          label="Tag NFC da coleira"
          optional
          placeholder="UID ou código da tag"
          hint={tagReader.error ?? 'Aproxime a coleira para preencher automaticamente.'}
          leadingIcon={<Nfc />}
          error={errors.tagIdentifier?.message}
          trailingAction={
            <Button variant="icon" aria-label="Ler tag NFC" onClick={readTag}>
              <Nfc aria-hidden="true" />
            </Button>
          }
          {...register('tagIdentifier')}
        />
      )}
    </form>
  );
}
