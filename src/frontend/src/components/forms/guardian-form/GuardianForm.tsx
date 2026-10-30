import type { ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { IdCard, Mail, MapPin, Phone, User } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input/Input';
import { formatCpfInput } from '@/utils/formatCpfInput';
import { formatPhoneInput } from '@/utils/formatPhoneInput';

import { GUARDIAN_FORM_DEFAULTS, guardianFormSchema, type GuardianFormValues } from './guardian-form.schema';
import styles from './guardian-form.module.scss';

type GuardianFormProps = {
  /** Lets a submit button outside the form (the modal footer) submit it via `form={formId}`. */
  formId: string;
  onSubmit: (values: GuardianFormValues) => void;
  /** Existing data when editing; a blank form otherwise. */
  defaultValues?: GuardianFormValues;
};

export function GuardianForm({ formId, onSubmit, defaultValues = GUARDIAN_FORM_DEFAULTS }: GuardianFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<GuardianFormValues>({ resolver: zodResolver(guardianFormSchema), defaultValues });

  // Masks are applied as the user types (setValue updates the input and the form state together)
  const maskOnChange = (name: 'phone' | 'cpf', format: (value: string) => string) => ({
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setValue(name, format(event.target.value), { shouldValidate: isSubmitted }),
  });

  return (
    <form id={formId} className={styles['guardian-form']} onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        id="guardian-name"
        label="Nome completo"
        placeholder="Ex.: Lucas Silva de Oliveira"
        autoComplete="name"
        leadingIcon={<User />}
        error={errors.name?.message}
        {...register('name')}
      />
      <div className={styles['guardian-form__row']}>
        <Input
          id="guardian-phone"
          label="Telefone"
          type="tel"
          inputMode="tel"
          placeholder="(15) 99999-9999"
          autoComplete="tel"
          leadingIcon={<Phone />}
          error={errors.phone?.message}
          {...register('phone', maskOnChange('phone', formatPhoneInput))}
        />
        <Input
          id="guardian-cpf"
          label="CPF"
          optional
          inputMode="numeric"
          placeholder="000.000.000-00"
          leadingIcon={<IdCard />}
          error={errors.cpf?.message}
          {...register('cpf', maskOnChange('cpf', formatCpfInput))}
        />
      </div>
      <Input
        id="guardian-email"
        label="E-mail"
        optional
        type="email"
        placeholder="nome@email.com"
        autoComplete="email"
        leadingIcon={<Mail />}
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="guardian-address"
        label="Endereço"
        optional
        placeholder="Rua, número, bairro - cidade/UF"
        autoComplete="street-address"
        leadingIcon={<MapPin />}
        error={errors.address?.message}
        {...register('address')}
      />
    </form>
  );
}
