import { zodResolver } from '@hookform/resolvers/zod';
import { PrescriptionItemType, type IApplyPrescriptionItemPayload } from '@nfcarevet/common';
import { FormProvider, useForm } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { Textarea } from '@/components/ui/textarea/Textarea';

import { VitalSignsFields } from '../vital-signs-fields/VitalSignsFields';

import {
  ADMINISTER_TASK_DEFAULTS,
  createAdministerTaskSchema,
  toApplyTaskPayload,
  type AdministerTaskFormValues,
} from './administer-task-form.schema';
import styles from './administer-task-form.module.scss';

type AdministerTaskFormProps = {
  formId: string;
  itemType: PrescriptionItemType;
  onSubmit: (payload: IApplyPrescriptionItemPayload) => void;
};

export function AdministerTaskForm({ formId, itemType, onSubmit }: AdministerTaskFormProps) {
  const form = useForm<AdministerTaskFormValues>({
    resolver: zodResolver(createAdministerTaskSchema(itemType)),
    defaultValues: ADMINISTER_TASK_DEFAULTS,
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <FormProvider {...form}>
      <form
        id={formId}
        className={styles['administer-task-form']}
        onSubmit={handleSubmit((values) => onSubmit(toApplyTaskPayload(values, itemType)))}
        noValidate
      >
        {itemType === PrescriptionItemType.VITAL_CHECK && <VitalSignsFields idPrefix="administer" />}

        <Textarea
          id="administer-notes"
          label="Observações à beira do leito"
          optional
          placeholder="Ex.: Paciente calmo, dose administrada sem intercorrências."
          error={errors.bedsideNotes?.message}
          {...register('bedsideNotes')}
        />

        {itemType === PrescriptionItemType.MEDICATION && (
          <div className={styles['administer-task-form__double-check']}>
            <Checkbox
              id="administer-double-check"
              label="Conferi paciente, medicamento, dose, via e horário"
              aria-invalid={errors.doubleChecked ? true : undefined}
              aria-describedby={errors.doubleChecked ? 'administer-double-check-error' : undefined}
              {...register('doubleChecked')}
            />
            {errors.doubleChecked && (
              <p id="administer-double-check-error" className={styles['administer-task-form__error']} role="alert">
                {errors.doubleChecked.message}
              </p>
            )}
          </div>
        )}
      </form>
    </FormProvider>
  );
}
