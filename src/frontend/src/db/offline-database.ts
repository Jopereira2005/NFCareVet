import Dexie, { type EntityTable, type Table } from 'dexie';
import type { IApplyPrescriptionItemPayload, IUserSummary } from '@nfcarevet/common';

import type { PaginatedTimeline } from '@/interfaces/clinical-event.types';
import type { Guardian } from '@/interfaces/guardian.types';
import type { Patient } from '@/interfaces/patient.types';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';

export interface CachedTimeline {
  patientId: string;
  timeline: PaginatedTimeline;
}

/** A task administered without connection, waiting to be sent to POST /bedside/items/:id/apply. */
export interface OutboxTaskApplication {
  /** Generated on the device; sent as the idempotency key so a retry never registers twice. */
  id: string;
  itemId: string;
  payload: IApplyPrescriptionItemPayload;
  executor: Pick<IUserSummary, 'id' | 'name' | 'role'>;
  /** Shown when the send fails, so the team knows which administration needs attention. */
  taskTitle: string;
  patientName: string;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface SnapshotMeta {
  key: 'snapshot';
  syncedAt: string;
  /** Whose session downloaded the data; another login wipes it. */
  userId: string;
}

/**
 * Offline copy of what the team needs at the bedside: the hospitalized patients, their guardians' contacts,
 * the nursing queue and the latest timeline page. Everything else is fetched online only.
 */
class OfflineDatabase extends Dexie {
  patients!: EntityTable<Patient, 'id'>;
  guardians!: EntityTable<Guardian, 'id'>;
  schedule!: Table<PendingScheduleItem, string>;
  timelines!: EntityTable<CachedTimeline, 'patientId'>;
  outbox!: EntityTable<OutboxTaskApplication, 'id'>;
  meta!: EntityTable<SnapshotMeta, 'key'>;

  constructor() {
    super('nfcarevet-offline');

    this.version(1).stores({
      patients: '&id, nfcTag.tagUid, guardianId',
      guardians: '&id',
      schedule: '&item.id, hospitalizationId',
      timelines: '&patientId',
      outbox: '&id, createdAt',
      meta: '&key',
    });
  }
}

export const offlineDb = new OfflineDatabase();

/** Tables replaced on each sync; the outbox is not among them, since it holds work not sent yet. */
export const SNAPSHOT_TABLES = [offlineDb.patients, offlineDb.guardians, offlineDb.schedule, offlineDb.timelines, offlineDb.meta];

/** Drops every offline record, pending administrations included (logout). */
export const clearOfflineData = () => Promise.all([...SNAPSHOT_TABLES, offlineDb.outbox].map((table) => table.clear()));
