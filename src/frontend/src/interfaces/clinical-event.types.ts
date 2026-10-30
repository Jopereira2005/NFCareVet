import type { EventType, IPatient, IUserSummary } from '@nfcarevet/common';

/** Mirrors `TimelineEventItemDto` from GET /hospitalizations/patient/:patientId/timeline. */
export interface TimelineEvent {
  id: string;
  hospitalizationId: string;
  eventType: EventType;
  title: string;
  description?: string | null;
  metrics?: Record<string, unknown> | null;
  recordedAt: string;
  executor: Pick<IUserSummary, 'id' | 'name' | 'role'>;
  /** Pending API: who prescribed the item that originated the event. */
  prescribedBy?: Pick<IUserSummary, 'id' | 'name'> | null;
  /** Pending API on the cross-patient feed; the patient timeline already knows it. */
  patient?: Pick<IPatient, 'id' | 'name'>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Mirrors `PaginatedTimelineResponseDto`. */
export interface PaginatedTimeline {
  items: TimelineEvent[];
  meta: PaginationMeta;
}

/** Pending API: PATCH /clinical-events/:id — corrections to a registered activity. */
export interface UpdateClinicalEventPayload {
  title: string;
  description?: string;
  metrics?: Record<string, unknown> | null;
  recordedAt: string;
}
