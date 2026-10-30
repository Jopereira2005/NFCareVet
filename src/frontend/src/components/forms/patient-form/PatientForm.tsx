import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, CalendarDays, Droplet, Mars, UserPlus, Venus, Weight } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

import { PawIcon } from '@/assets/icons/paw-icon';
import { Checkbox } from '@/components/ui/checkbox/Checkbox';
import { ChoiceGroup, type ChoiceOption } from '@/components/ui/choice-group/ChoiceGroup';
import { Input } from '@/components/ui/input/Input';
import { SectionLabel } from '@/components/ui/section-label/SectionLabel';
import { Select, type SelectOption } from '@/components/ui/select/Select';
import { Textarea } from '@/components/ui/textarea/Textarea';
import { toDateTimeLocalValue } from '@/utils/toDateTimeLocalValue';

import { getPatientFormDefaults, patientFormSchema, type PatientFormValues } from './patient-form.schema';
import styles from './patient-form.module.scss';

const SPECIES_OPTIONS: ChoiceOption<string>[] = [
  { value: 'Canina', label: 'Cachorro', icon: PawIcon },
  { value: 'Felina', label: 'Gato', icon: PawIcon },
];

const SEX_OPTIONS: ChoiceOption<string>[] = [
  { value: 'MALE', label: 'Macho', icon: Mars },
  { value: 'FEMALE', label: 'Fêmea', icon: Venus },
];

type PatientFormProps = {
  formId: string;
  onSubmit: (values: PatientFormValues) => void;
  /** Existing data when editing; a blank form otherwise. */
  defaultValues?: PatientFormValues;
  /** Guardian already decided (e.g. from the guardian profile): the selector is replaced by a read-only field. */
  fixedGuardian?: { id: string; name: string };
  guardianOptions?: SelectOption[];
  /** Selects a guardian created while the form was open. */
  createdGuardianId?: string;
  onRequestNewGuardian?: () => void;
};

export function PatientForm({ formId, onSubmit, defaultValues, fixedGuardian, guardianOptions = [], createdGuardianId, onRequestNewGuardian }: PatientFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: defaultValues ?? getPatientFormDefaults(fixedGuardian?.id),
  });

  useEffect(() => {
    if (createdGuardianId) setValue('guardianId', createdGuardianId, { shouldValidate: true });
  }, [createdGuardianId, setValue]);

  const today = toDateTimeLocalValue(new Date()).slice(0, 10);

  return (
    <form id={formId} className={styles['patient-form']} onSubmit={handleSubmit(onSubmit)} noValidate>
      <SectionLabel label="Tutor" />
      {fixedGuardian ? (
        <Input id="patient-guardian" label="Tutor responsável" value={fixedGuardian.name} disabled readOnly />
      ) : (
        <div className={styles['patient-form__guardian']}>
          <Select
            id="patient-guardian"
            label="Tutor responsável"
            placeholder="Selecione o tutor"
            options={guardianOptions}
            error={errors.guardianId?.message}
            {...register('guardianId')}
          />
          {onRequestNewGuardian && (
            <button type="button" className={styles['patient-form__guardian__new']} onClick={onRequestNewGuardian}>
              <UserPlus aria-hidden="true" />
              Cadastrar novo tutor
            </button>
          )}
        </div>
      )}

      <SectionLabel label="Identificação" />
      <Input id="patient-name" label="Nome do pet" placeholder="Ex.: Thor" error={errors.name?.message} {...register('name')} />
      <Controller
        control={control}
        name="species"
        render={({ field }) => (
          <ChoiceGroup name="patient-species" label="Espécie" options={SPECIES_OPTIONS} value={field.value} onChange={field.onChange} error={errors.species?.message} />
        )}
      />
      <Controller
        control={control}
        name="sex"
        render={({ field }) => (
          <ChoiceGroup name="patient-sex" label="Sexo" optional options={SEX_OPTIONS} value={field.value} onChange={field.onChange} error={errors.sex?.message} />
        )}
      />
      <div className={styles['patient-form__row']}>
        <Input id="patient-breed" label="Raça" optional placeholder="Ex.: Golden Retriever" error={errors.breed?.message} {...register('breed')} />
        <Input
          id="patient-birth-date"
          label="Nascimento"
          optional
          type="date"
          max={today}
          leadingIcon={<CalendarDays />}
          error={errors.birthDate?.message}
          {...register('birthDate')}
        />
      </div>

      <SectionLabel label="Dados clínicos" />
      <div className={styles['patient-form__row']}>
        <Input
          id="patient-weight"
          label="Peso (kg)"
          optional
          inputMode="decimal"
          placeholder="Ex.: 28,4"
          leadingIcon={<Weight />}
          error={errors.weightKg?.message}
          {...register('weightKg')}
        />
        <Input
          id="patient-blood-type"
          label="Tipo sanguíneo"
          optional
          placeholder="Ex.: DEA 1.1+"
          leadingIcon={<Droplet />}
          error={errors.bloodType?.message}
          {...register('bloodType')}
        />
      </div>
      <Input
        id="patient-allergies"
        label="Alergias"
        optional
        placeholder="Ex.: Dipirona, Penicilina"
        hint="Separe por vírgula; cada uma vira um alerta no prontuário."
        leadingIcon={<Ban />}
        error={errors.allergies?.message}
        {...register('allergies')}
      />
      <Textarea
        id="patient-behavior"
        label="Comportamento"
        optional
        placeholder="Ex.: Manso e obediente; agitado durante exames"
        error={errors.behaviorNotes?.message}
        {...register('behaviorNotes')}
      />
      <Checkbox id="patient-castrated" label="Castrado(a)" {...register('isCastrated')} />
    </form>
  );
}
