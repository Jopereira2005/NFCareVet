import { zodResolver } from '@hookform/resolvers/zod';
import type { IUnlinkTagPayload } from '@nfcarevet/common';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Textarea } from '@/components/ui/textarea/Textarea';

import styles from './unlink-tag-form.module.scss';

const unlinkTagSchema = z.object({
  reason: z.string().trim().max(300, 'Use no máximo 300 caracteres'),
});

type UnlinkTagFormProps = {
  formId: string;
  onSubmit: (payload: IUnlinkTagPayload) => void;
};

export function UnlinkTagForm({ formId, onSubmit }: UnlinkTagFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof unlinkTagSchema>>({ resolver: zodResolver(unlinkTagSchema), defaultValues: { reason: '' } });

  return (
    <form id={formId} className={styles['unlink-tag-form']} onSubmit={handleSubmit(({ reason }) => onSubmit({ reason: reason || undefined }))} noValidate>
      <Textarea
        id="unlink-tag-reason"
        label="Motivo"
        optional
        placeholder="Ex.: Higienização e liberação para reuso"
        error={errors.reason?.message}
        {...register('reason')}
      />
    </form>
  );
}
