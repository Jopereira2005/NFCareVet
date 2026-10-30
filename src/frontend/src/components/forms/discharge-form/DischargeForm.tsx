import { zodResolver } from '@hookform/resolvers/zod';
import { DischargeReason, type IDischargeHospitalizationPayload } from '@nfcarevet/common';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { ChoiceGroup } from '@/components/ui/choice-group/ChoiceGroup';
import { Textarea } from '@/components/ui/textarea/Textarea';

import { DISCHARGE_DEFAULTS, DISCHARGE_REASON_LABEL, dischargeFormSchema, toDischargePayload, type DischargeFormValues } from './discharge-form.schema';
import styles from './discharge-form.module.scss';

const REASON_OPTIONS = Object.entries(DISCHARGE_REASON_LABEL).map(([value, label]) => ({ value, label }));

type DischargeFormProps = {
  formId: string;
  onSubmit: (payload: IDischargeHospitalizationPayload) => void;
  /** Lets the modal adapt its confirm button to the chosen reason (e.g. death). */
  onReasonChange?: (reason: DischargeReason) => void;
};

export function DischargeForm({ formId, onSubmit, onReasonChange }: DischargeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DischargeFormValues>({ resolver: zodResolver(dischargeFormSchema), defaultValues: DISCHARGE_DEFAULTS });
  const reason = useWatch({ control, name: 'dischargeReason' });
  const isDeceased = reason === DischargeReason.DECEASED;

  return (
    <form id={formId} className={styles['discharge-form']} onSubmit={handleSubmit((values) => onSubmit(toDischargePayload(values)))} noValidate>
      <Controller
        control={control}
        name="dischargeReason"
        render={({ field }) => (
          <ChoiceGroup
            name="discharge-reason"
            label="Motivo"
            options={REASON_OPTIONS}
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              onReasonChange?.(value as DischargeReason);
            }}
            error={errors.dischargeReason?.message}
          />
        )}
      />
      <Textarea
        id="discharge-notes"
        label={isDeceased ? 'Registro do óbito' : 'Evolução clínica final'}
        optional={reason !== DischargeReason.OTHER}
        placeholder={isDeceased ? 'Ex.: Horário, causa provável e procedimentos realizados' : 'Ex.: Paciente estável, alimentando-se espontaneamente'}
        error={errors.dischargeNotes?.message}
        {...register('dischargeNotes')}
      />
      {!isDeceased && (
        <Textarea
          id="discharge-recommendations"
          label="Recomendações ao tutor"
          optional
          placeholder="Ex.: Antibiótico oral por 7 dias e retorno para reavaliação"
          error={errors.medicalRecommendations?.message}
          {...register('medicalRecommendations')}
        />
      )}
    </form>
  );
}
