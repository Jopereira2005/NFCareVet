import type { IApplyPrescriptionItemPayload, IApplyPrescriptionItemResponse, IUserSummary } from '@nfcarevet/common';

import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { ApiError } from '@/services/api-error';
import { prescriptionService } from '@/services/prescription.service';

import { isNetworkError } from './offline-cache';
import { offlineDb, type OutboxTaskApplication } from './offline-database';

export type ApplyTaskResult = { queued: false; response: IApplyPrescriptionItemResponse } | { queued: true };

export interface OutboxFlushResult {
  sent: number;
  /** Administrations the API refused (task already done or cancelled by a colleague, validation...). */
  rejected: OutboxTaskApplication[];
}

// The task no longer accepts an administration: retrying would never succeed
const isFinalRejection = (error: unknown) => error instanceof ApiError && [400, 404, 409, 422].includes(error.status);

/**
 * Administers the task online or, without connection, saves it on the device and removes it from the
 * cached queue so the screen reflects it right away. The outbox sends it once the connection is back.
 */
export async function applyTaskOrQueue(
  entry: PendingScheduleItem,
  payload: IApplyPrescriptionItemPayload,
  executor: Pick<IUserSummary, 'id' | 'name' | 'role'>,
): Promise<ApplyTaskResult> {
  const requestId = crypto.randomUUID();

  if (navigator.onLine) {
    try {
      return { queued: false, response: await prescriptionService.applyTask(entry.item.id, payload, executor, requestId) };
    } catch (error) {
      if (!isNetworkError(error)) throw error;
    }
  }

  await offlineDb.transaction('rw', offlineDb.outbox, offlineDb.schedule, async () => {
    await offlineDb.outbox.add({
      id: requestId,
      itemId: entry.item.id,
      payload,
      executor,
      taskTitle: entry.item.title,
      patientName: entry.patient.name,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    await offlineDb.schedule.delete(entry.item.id);
  });

  return { queued: true };
}

/** Sends the pending administrations in the order they were made; stops at the first connection failure. */
export async function flushTaskOutbox(): Promise<OutboxFlushResult> {
  const entries = await offlineDb.outbox.orderBy('createdAt').toArray();
  const result: OutboxFlushResult = { sent: 0, rejected: [] };

  for (const entry of entries) {
    try {
      await prescriptionService.applyTask(entry.itemId, entry.payload, entry.executor, entry.id);
      await offlineDb.outbox.delete(entry.id);
      result.sent += 1;
    } catch (error) {
      if (isNetworkError(error)) break;

      const lastError = error instanceof Error ? error.message : 'Erro inesperado.';
      if (isFinalRejection(error)) {
        await offlineDb.outbox.delete(entry.id);
        result.rejected.push({ ...entry, lastError });
      } else {
        await offlineDb.outbox.update(entry.id, { attempts: entry.attempts + 1, lastError });
      }
    }
  }

  return result;
}
