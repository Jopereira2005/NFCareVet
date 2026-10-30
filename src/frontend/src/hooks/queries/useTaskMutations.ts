import { useMutation } from '@tanstack/react-query';

import type { IApplyPrescriptionItemPayload } from '@nfcarevet/common';

import { applyTaskOrQueue } from '@/db/task-outbox';
import type { UpdateClinicalEventPayload } from '@/interfaces/clinical-event.types';
import type { CancelTaskPayload, CreateTaskPayload, PendingScheduleItem, UpdateTaskPayload } from '@/interfaces/prescription.types';
import { hospitalizationService } from '@/services/hospitalization.service';
import { prescriptionService } from '@/services/prescription.service';
import { patientQueries, scheduleQueries } from '@/services/query-options';
import { useSessionStore } from '@/stores/useSessionStore';
import { showToast } from '@/stores/useToastStore';

export const useCreateTask = () => {
  const userId = useSessionStore((state) => state.user?.id ?? '');

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => prescriptionService.createTask(payload, userId),
    meta: { successMessage: 'Tarefa criada', errorMessage: 'Não foi possível criar a tarefa', invalidates: [scheduleQueries.all()] },
  });
};

export const useUpdateTask = () =>
  useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateTaskPayload }) => prescriptionService.updateTask(itemId, payload),
    meta: { successMessage: 'Tarefa atualizada', errorMessage: 'Não foi possível salvar a tarefa', invalidates: [scheduleQueries.all()] },
  });

export const useCancelTask = () =>
  useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: CancelTaskPayload }) => prescriptionService.cancelTask(itemId, payload),
    meta: { successMessage: 'Tarefa cancelada', errorMessage: 'Não foi possível cancelar a tarefa', invalidates: [scheduleQueries.all()] },
  });

export const useUpdateClinicalEvent = () =>
  useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateClinicalEventPayload }) =>
      hospitalizationService.updateClinicalEvent(eventId, payload),
    meta: {
      successMessage: 'Registro atualizado',
      errorMessage: 'Não foi possível salvar o registro',
      // The event appears in "Atividades Concluídas" and in the patient's timeline
      invalidates: [scheduleQueries.all(), patientQueries.all()],
    },
  });

/**
 * Administers a task: it leaves the queue and becomes a completed activity in the patient's record.
 * Without connection it is saved on the device and sent when the connection returns.
 */
export const useApplyTask = () => {
  const user = useSessionStore((state) => state.user);

  return useMutation({
    mutationFn: ({ entry, payload }: { entry: PendingScheduleItem; payload: IApplyPrescriptionItemPayload }) => {
      if (!user) throw new Error('Sessão expirada. Entre novamente.');
      return applyTaskOrQueue(entry, payload, { id: user.id, name: user.name, role: user.role });
    },
    onSuccess: (result) =>
      showToast(
        result.queued
          ? { tone: 'warning', title: 'Administração salva offline', description: 'Ela será enviada assim que a conexão voltar.' }
          : { tone: 'success', title: 'Tarefa concluída' },
      ),
    meta: {
      errorMessage: 'Não foi possível registrar a administração',
      invalidates: [scheduleQueries.all(), patientQueries.all()],
    },
  });
};
