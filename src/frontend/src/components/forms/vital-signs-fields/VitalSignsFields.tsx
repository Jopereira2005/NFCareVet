import { useFormContext, useFormState } from 'react-hook-form';

import { Input } from '@/components/ui/input/Input';
import { SectionLabel } from '@/components/ui/section-label/SectionLabel';

import { VITAL_SIGN_FIELDS, type VitalSignField, type VitalSignsValues } from './vital-signs.schema';
import styles from './vital-signs-fields.module.scss';

const NUMERIC_FIELDS = Object.entries(VITAL_SIGN_FIELDS) as [VitalSignField, (typeof VITAL_SIGN_FIELDS)[VitalSignField]][];

type VitalSignsFieldsProps = {
  /** Prefix for the input ids, so two forms on screen never share an id. */
  idPrefix: string;
};

/**
 * Vital sign inputs shared by every form that records measurements. Reads the parent form through
 * `useFormContext`, so the parent must wrap its <form> in a <FormProvider> and spread `vitalSignsShape` into its schema.
 */
export function VitalSignsFields({ idPrefix }: VitalSignsFieldsProps) {
  const { register, control } = useFormContext<VitalSignsValues>();
  // useFormState subscribes this component to error changes on its own; reading `formState` from the
  // context would not re-render it, since the React Compiler memoizes it while its props stay the same
  const { errors } = useFormState({ control });

  return (
    <>
      <SectionLabel label="Aferições" />
      <div className={styles['vital-signs-fields']}>
        {NUMERIC_FIELDS.map(([field, { label, unit }]) => (
          <Input
            key={field}
            id={`${idPrefix}-${field}`}
            label={`${label} (${unit})`}
            optional
            inputMode="decimal"
            error={errors[field]?.message}
            {...register(field)}
          />
        ))}
        <Input
          id={`${idPrefix}-crt`}
          label="TPC"
          optional
          placeholder="Ex.: < 2s"
          error={errors.capillaryRefillTime?.message}
          {...register('capillaryRefillTime')}
        />
      </div>
    </>
  );
}
