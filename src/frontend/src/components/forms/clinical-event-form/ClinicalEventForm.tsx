import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input/Input';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { toDateTimeLocalValue } from '@/utils/toDateTimeLocalValue';

import { VitalSignsFields } from '../vital-signs-fields/VitalSignsFields';

import { clinicalEventFormSchema, type ClinicalEventFormValues } from './clinical-event-form.schema';
import styles from './clinical-event-form.module.scss';

type ClinicalEventFormProps = {
  formId: string;
  defaultValues: ClinicalEventFormValues;
  /** Shows the vital sign measurements; other event types only have the notes. */
  isVitalSigns: boolean;
  onSubmit: (values: ClinicalEventFormValues) => void;
};

export function ClinicalEventForm({ formId, defaultValues, isVitalSigns, onSubmit }: ClinicalEventFormProps) {
  const form = useForm<ClinicalEventFormValues>({ resolver: zodResolver(clinicalEventFormSchema), defaultValues });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <FormProvider {...form}>
      <form id={formId} className={styles['clinical-event-form']} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input id="event-title" label="Título" error={errors.title?.message} {...register('title')} />
        <Input
          id="event-recorded-at"
          label="Realizado em"
          type="datetime-local"
          max={toDateTimeLocalValue(new Date())}
          leadingIcon={<CalendarClock />}
          error={errors.recordedAt?.message}
          {...register('recordedAt')}
        />

        {isVitalSigns && <VitalSignsFields idPrefix="event" />}

        <Textarea
          id="event-notes"
          label="Observações"
          optional
          placeholder="Ex.: Mucosas normocoradas, paciente alerta."
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </FormProvider>
  );
}
