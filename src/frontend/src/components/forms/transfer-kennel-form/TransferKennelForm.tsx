import { zodResolver } from '@hookform/resolvers/zod';
import type { ITransferKennelPayload } from '@nfcarevet/common';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Select, type SelectOption } from '@/components/ui/select/Select';
import { Textarea } from '@/components/ui/textarea/Textarea';

import styles from './transfer-kennel-form.module.scss';

const transferKennelSchema = z.object({
  targetKennelId: z.string().min(1, 'Selecione a baia de destino'),
  reason: z.string().trim().max(300, 'Use no máximo 300 caracteres'),
});

type TransferKennelFormValues = z.infer<typeof transferKennelSchema>;

type TransferKennelFormProps = {
  formId: string;
  /** Destination options; the current kennel is left out by the caller. */
  kennelOptions: SelectOption[];
  onSubmit: (payload: ITransferKennelPayload) => void;
};

export function TransferKennelForm({ formId, kennelOptions, onSubmit }: TransferKennelFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransferKennelFormValues>({ resolver: zodResolver(transferKennelSchema), defaultValues: { targetKennelId: '', reason: '' } });

  return (
    <form
      id={formId}
      className={styles['transfer-kennel-form']}
      onSubmit={handleSubmit(({ targetKennelId, reason }) => onSubmit({ targetKennelId, reason: reason || undefined }))}
      noValidate
    >
      <Select
        id="transfer-kennel"
        label="Baia de destino"
        placeholder="Selecione a baia"
        options={kennelOptions}
        error={errors.targetKennelId?.message}
        {...register('targetKennelId')}
      />
      <Textarea
        id="transfer-reason"
        label="Motivo"
        optional
        placeholder="Ex.: Transferência para baia de isolamento"
        error={errors.reason?.message}
        {...register('reason')}
      />
    </form>
  );
}
