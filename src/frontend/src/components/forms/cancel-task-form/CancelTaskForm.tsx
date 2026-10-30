import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/Button';
import { Textarea } from '@/components/ui/textarea/Textarea';
import type { CancelTaskPayload } from '@/interfaces/prescription.types';

import styles from './cancel-task-form.module.scss';

// Same limits as CancelPrescriptionItemDto
const cancelTaskSchema = z.object({
  justification: z.string().trim().min(10, 'Explique o motivo com pelo menos 10 caracteres').max(500, 'Use no máximo 500 caracteres'),
});

type CancelTaskFormProps = {
  isSubmitting: boolean;
  onSubmit: (payload: CancelTaskPayload) => void;
  onBack: () => void;
};

/** Second step of cancelling a task: the API records who cancelled it and why. */
export function CancelTaskForm({ isSubmitting, onSubmit, onBack }: CancelTaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelTaskPayload>({ resolver: zodResolver(cancelTaskSchema), defaultValues: { justification: '' } });

  return (
    <form className={styles['cancel-task-form']} onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className={styles['cancel-task-form__warning']}>
        A tarefa sai da fila do plantão e o cancelamento fica registrado no prontuário.
      </p>
      <Textarea
        id="cancel-task-justification"
        label="Justificativa"
        placeholder="Ex.: Medicação suspensa pelo veterinário responsável"
        autoFocus
        error={errors.justification?.message}
        {...register('justification')}
      />
      <div className={styles['cancel-task-form__actions']}>
        <Button variant="outlined" onClick={onBack}>
          Voltar
        </Button>
        <Button type="submit" variant="danger" disabled={isSubmitting}>
          {isSubmitting ? 'Cancelando…' : 'Confirmar cancelamento'}
        </Button>
      </div>
    </form>
  );
}
