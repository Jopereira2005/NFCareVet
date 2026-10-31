import {
  EventType,
  PrescriptionItemType,
  PrescriptionStatus,
  type IApplyPrescriptionItemPayload,
  type IApplyPrescriptionItemResponse,
  type IPrescription,
  type IPrescriptionItem,
  type IUserSummary,
} from '@nfcarevet/common';

import type { TimelineEvent } from '@/interfaces/clinical-event.types';

import type {
  CancelTaskPayload,
  CreateTaskPayload,
  PendingScheduleItem,
  PendingScheduleQuery,
  UpdateTaskPayload,
} from '@/interfaces/prescription.types';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';
import { PENDING_SCHEDULE_MOCK } from '@/mocks/schedule.mock';
import { TIMELINE_MOCK } from '@/mocks/timeline.mock';
import { CURRENT_USER_MOCK, VET_MOCK } from '@/mocks/users.mock';

import { httpClient } from './http-client';
import { mockNotFound, mockResponse, USE_MOCKS } from './mock-response';

// Same mapping the API applies when an item is administered (BedsideRepository.applyPrescriptionItem)
const EVENT_TYPE_BY_ITEM_TYPE: Record<PrescriptionItemType, EventType> = {
  [PrescriptionItemType.MEDICATION]: EventType.MEDICATION_APPLICATION,
  [PrescriptionItemType.VITAL_CHECK]: EventType.VITAL_SIGNS,
  [PrescriptionItemType.PROCEDURE]: EventType.PROCEDURE,
  [PrescriptionItemType.EXAM]: EventType.EXAM,
};

// In the mocks the logged admin covers Dr. Mr Paxe's shift, so "mine" means his items
const MOCK_SHIFT_OWNER_IDS = new Set([CURRENT_USER_MOCK.id, VET_MOCK.id]);

export const prescriptionService = {
  /** GET /prescriptions/schedule/pending — nursing queue for the next hours, overdue items included. */
  async getPendingSchedule({ onlyMine, ...params }: PendingScheduleQuery = {}): Promise<PendingScheduleItem[]> {
    if (USE_MOCKS) {
      const items = PENDING_SCHEDULE_MOCK.filter(
        (entry) =>
          (!params.hospitalizationId || entry.hospitalizationId === params.hospitalizationId) &&
          (!onlyMine || (entry.assignee && MOCK_SHIFT_OWNER_IDS.has(entry.assignee.id))),
      );
      return mockResponse(items);
    }

    const { data } = await httpClient.get<PendingScheduleItem[]>('/prescriptions/schedule/pending', {
      params: { ...params, ...(onlyMine !== undefined ? { onlyMine } : {}) },
    });
    return data;
  },

  /** POST /hospitalizations/:id/prescriptions — a new task is a prescription with a single item. */
  async createTask({ hospitalizationId, item }: CreateTaskPayload, prescribedById: string): Promise<IPrescriptionItem> {
    if (USE_MOCKS) {
      const patient = PATIENTS_MOCK.find(({ activeHospitalization }) => activeHospitalization?.id === hospitalizationId);
      if (!patient) return mockNotFound('Internação');

      const now = new Date().toISOString();
      const created: IPrescriptionItem = {
        ...item,
        id: `item-${Date.now()}`,
        prescriptionId: `presc-${Date.now()}`,
        status: PrescriptionStatus.PENDING,
        createdAt: now,
      };
      const kennel = PENDING_SCHEDULE_MOCK.find((entry) => entry.hospitalizationId === hospitalizationId)?.kennel;
      PENDING_SCHEDULE_MOCK.push({
        item: created,
        hospitalizationId,
        patient,
        kennel: kennel ?? { id: 'kennel-unknown', name: 'Leito não informado' },
        isOverdue: Date.parse(String(item.scheduledTime)) < Date.now(),
        assignee: { id: prescribedById, name: CURRENT_USER_MOCK.name },
      });
      return mockResponse(created);
    }

    const { data } = await httpClient.post<IPrescription>(`/hospitalizations/${hospitalizationId}/prescriptions`, {
      prescribedById,
      autoDeactivatePrevious: false,
      items: [item],
    });
    return data.items?.[0] as IPrescriptionItem;
  },

  /** PATCH /prescription-items/:id */
  async updateTask(itemId: string, payload: UpdateTaskPayload): Promise<IPrescriptionItem> {
    if (USE_MOCKS) {
      const entry = PENDING_SCHEDULE_MOCK.find(({ item }) => item.id === itemId);
      if (!entry) return mockNotFound('Tarefa');

      Object.assign(entry.item, payload);
      entry.isOverdue = Date.parse(String(entry.item.scheduledTime)) < Date.now();
      return mockResponse(entry.item);
    }

    const { data } = await httpClient.patch<IPrescriptionItem>(`/prescription-items/${itemId}`, payload);
    return data;
  },

  /** PATCH /prescription-items/:id/cancel — the API requires a justification. */
  async cancelTask(itemId: string, payload: CancelTaskPayload): Promise<void> {
    if (USE_MOCKS) {
      const index = PENDING_SCHEDULE_MOCK.findIndex(({ item }) => item.id === itemId);
      if (index === -1) return mockNotFound('Tarefa');

      PENDING_SCHEDULE_MOCK.splice(index, 1);
      return mockResponse(undefined);
    }

    await httpClient.patch(`/prescription-items/${itemId}/cancel`, payload);
  },

  /** POST /bedside/items/:id/apply — marks the item APPLIED and registers the clinical event in the record. */
  async applyTask(
    itemId: string,
    payload: IApplyPrescriptionItemPayload,
    executor: Pick<IUserSummary, 'id' | 'name' | 'role'>,
    requestId?: string,
  ): Promise<IApplyPrescriptionItemResponse> {
    if (USE_MOCKS) {
      const index = PENDING_SCHEDULE_MOCK.findIndex(({ item }) => item.id === itemId);
      if (index === -1) return mockNotFound('Tarefa');

      const [entry] = PENDING_SCHEDULE_MOCK.splice(index, 1);
      const now = new Date().toISOString();
      const event: TimelineEvent = {
        id: `event-${Date.now()}`,
        hospitalizationId: entry.hospitalizationId,
        eventType: EVENT_TYPE_BY_ITEM_TYPE[entry.item.itemType],
        title: `Execução de item: ${entry.item.title}`,
        description: payload.bedsideNotes ?? null,
        metrics: payload.metrics ?? null,
        recordedAt: now,
        executor,
        prescribedBy: entry.assignee ?? null,
        patient: { id: entry.patient.id, name: entry.patient.name },
      };
      TIMELINE_MOCK.unshift(event);

      return mockResponse({
        message: 'Procedimento registrado com sucesso',
        prescriptionItem: { ...entry.item, status: PrescriptionStatus.APPLIED },
        clinicalEvent: { ...event, userId: executor.id },
      });
    }

    const { data } = await httpClient.post<IApplyPrescriptionItemResponse>(`/bedside/items/${itemId}/apply`, payload, {
      headers: requestId ? { 'Idempotency-Key': requestId } : undefined,
    });
    return data;
  },
};
