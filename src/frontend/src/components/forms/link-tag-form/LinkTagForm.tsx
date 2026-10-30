import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Select, type SelectOption } from '@/components/ui/select/Select';

import styles from './link-tag-form.module.scss';

const linkTagSchema = z.object({
  hospitalizationId: z.string().min(1, 'Selecione o paciente internado'),
});

type LinkTagFormProps = {
  formId: string;
  /** Hospitalized patients; the ones that already wear a tag come disabled. */
  patientOptions: SelectOption[];
  onSubmit: (hospitalizationId: string) => void;
};

export function LinkTagForm({ formId, patientOptions, onSubmit }: LinkTagFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof linkTagSchema>>({ resolver: zodResolver(linkTagSchema), defaultValues: { hospitalizationId: '' } });
  const hasAvailablePatient = patientOptions.some(({ disabled }) => !disabled);

  return (
    <form id={formId} className={styles['link-tag-form']} onSubmit={handleSubmit(({ hospitalizationId }) => onSubmit(hospitalizationId))} noValidate>
      <Select
        id="link-tag-patient"
        label="Paciente internado"
        placeholder="Selecione o paciente"
        options={patientOptions}
        hint={hasAvailablePatient ? 'Pacientes que já usam uma tag precisam liberá-la antes.' : 'Nenhum paciente internado sem tag no momento.'}
        error={errors.hospitalizationId?.message}
        {...register('hospitalizationId')}
      />
    </form>
  );
}
