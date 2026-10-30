import type { ICreatePrescriptionItemPayload, IPatient, IPrescriptionItem, IUserSummary } from '@nfcarevet/common';

/** Derived on the client from the due time (see `getTaskPriority`). */
export type TaskPriority = 'high' | 'medium' | 'low';

/** Mirrors `PendingScheduleItemResponseDto` from GET /prescriptions/schedule/pending. */
export interface PendingScheduleItem {
  item: IPrescriptionItem;
  hospitalizationId: string;
  patient: Pick<IPatient, 'id' | 'name' | 'species' | 'breed' | 'isFasting' | 'allergies' | 'behaviorNotes'>;
  kennel: { id: string; name: string };
  isOverdue: boolean;
  minutesOverdue?: number;
  /** Pending API: professional responsible for the item. */
  assignee?: Pick<IUserSummary, 'id' | 'name'> | null;
}

export interface PendingScheduleQuery {
  windowHours?: number;
  includeOverdue?: boolean;
  hospitalizationId?: string;
  /** Pending API: only items assigned to the logged user. */
  onlyMine?: boolean;
}

/** A new task is a one-item prescription on the patient's hospitalization (POST /hospitalizations/:id/prescriptions). */
export interface CreateTaskPayload {
  hospitalizationId: string;
  item: ICreatePrescriptionItemPayload;
}

/** Pending API: PATCH /prescription-items/:id */
export type UpdateTaskPayload = Partial<ICreatePrescriptionItemPayload>;

/** Mirrors `CancelPrescriptionItemDto` (PATCH /prescription-items/:id/cancel). */
export interface CancelTaskPayload {
  justification: string;
  notes?: string;
}
