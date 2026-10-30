import { zodResolver } from '@hookform/resolvers/zod';
import { PrescriptionItemType } from '@nfcarevet/common';
import { CalendarClock, Syringe } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { ChoiceGroup } from '@/components/ui/choice-group/ChoiceGroup';
import { Input } from '@/components/ui/input/Input';
import { Select, type SelectOption } from '@/components/ui/select/Select';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { ADMINISTRATION_ROUTE_LABEL, PRESCRIPTION_ITEM_TYPE } from '@/constants/prescription.constants';

import { taskFormSchema, type TaskFormValues } from './task-form.schema';
import styles from './task-form.module.scss';

const ITEM_TYPE_OPTIONS = Object.entries(PRESCRIPTION_ITEM_TYPE).map(([value, { label, icon }]) => ({ value, label, icon }));
const ROUTE_OPTIONS: SelectOption[] = Object.entries(ADMINISTRATION_ROUTE_LABEL).map(([value, label]) => ({ value, label }));

type TaskFormProps = {
  formId: string;
  defaultValues: TaskFormValues;
  onSubmit: (values: TaskFormValues) => void;
  /** Hospitalized patients to choose from; omit with `fixedPatientName` when the patient is already known. */
  patientOptions?: SelectOption[];
  fixedPatientName?: string;
};

export function TaskForm({ formId, defaultValues, onSubmit, patientOptions = [], fixedPatientName }: TaskFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskFormSchema), defaultValues });
  const isMedication = useWatch({ control, name: 'itemType' }) === PrescriptionItemType.MEDICATION;

  return (
    <form id={formId} className={styles['task-form']} onSubmit={handleSubmit(onSubmit)} noValidate>
      {fixedPatientName ? (
        <Input id="task-patient" label="Paciente" value={fixedPatientName} disabled readOnly />
      ) : (
        <Select
          id="task-patient"
          label="Paciente internado"
          placeholder="Selecione o paciente"
          options={patientOptions}
          hint={patientOptions.length === 0 ? 'Nenhum paciente internado no momento.' : undefined}
          error={errors.hospitalizationId?.message}
          {...register('hospitalizationId')}
        />
      )}

      <Controller
        control={control}
        name="itemType"
        render={({ field }) => (
          <ChoiceGroup name="task-type" label="Tipo" options={ITEM_TYPE_OPTIONS} value={field.value} onChange={field.onChange} error={errors.itemType?.message} />
        )}
      />

      <Input
        id="task-title"
        label={isMedication ? 'Medicamento' : 'Descrição'}
        placeholder={isMedication ? 'Ex.: Ceftriaxona 1g' : 'Ex.: Coleta de sangue'}
        error={errors.title?.message}
        {...register('title')}
      />

      {isMedication && (
        <div className={styles['task-form__row']}>
          <Input id="task-dosage" label="Dose" placeholder="Ex.: 25 mg/kg" leadingIcon={<Syringe />} error={errors.dosage?.message} {...register('dosage')} />
          <Select id="task-route" label="Via" placeholder="Selecione" options={ROUTE_OPTIONS} error={errors.route?.message} {...register('route')} />
        </div>
      )}

      <Input
        id="task-scheduled-at"
        label="Data e horário"
        type="datetime-local"
        leadingIcon={<CalendarClock />}
        error={errors.scheduledAt?.message}
        {...register('scheduledAt')}
      />

      <Textarea
        id="task-instructions"
        label="Instruções"
        optional
        placeholder="Ex.: Controle de plaquetas pós-infusão"
        error={errors.instructions?.message}
        {...register('instructions')}
      />
    </form>
  );
}
