import type { PaginatedTimeline } from '@/interfaces/clinical-event.types';
import type { Guardian } from '@/interfaces/guardian.types';
import type { Patient } from '@/interfaces/patient.types';
import type { PendingScheduleItem, PendingScheduleQuery } from '@/interfaces/prescription.types';
import { ApiError } from '@/services/api-error';
import type { PatientSearchParams } from '@/services/patient.service';
import { normalizeText } from '@/utils/normalizeText';

import { offlineDb } from './offline-database';

/** Axios reports a request that never reached the server with no status. */
export const isNetworkError = (error: unknown) => error instanceof ApiError && error.status === 0;

/**
 * Runs the request online and answers from the offline copy when there is no connection.
 * Data outside the copy (patients not hospitalized, older history) still fails, with a clear message.
 */
export async function withOfflineFallback<T>(request: () => Promise<T>, readCache: () => Promise<T | undefined>): Promise<T> {
  if (!navigator.onLine) {
    const cached = await readCache();
    if (cached !== undefined) return cached;
    throw new ApiError('Sem conexão. Este dado não está na cópia offline dos pacientes internados.', 0);
  }

  try {
    return await request();
  } catch (error) {
    if (!isNetworkError(error)) throw error;

    const cached = await readCache();
    if (cached === undefined) throw error;
    return cached;
  }
}

export const offlineCache = {
  getPatient: (patientId: string): Promise<Patient | undefined> => offlineDb.patients.get(patientId),

  getPatientByTagUid: (tagUid: string): Promise<Patient | undefined> => offlineDb.patients.where('nfcTag.tagUid').equals(tagUid).first(),

  async searchPatients({ query, species, sex, hospitalized }: PatientSearchParams): Promise<Patient[]> {
    // Only hospitalized patients are cached, so a search for the others has nothing to show
    if (hospitalized === false) return [];

    const term = normalizeText(query ?? '');
    const patients = await offlineDb.patients.toArray();

    return patients.filter(
      (patient) =>
        [patient.name, patient.guardian?.name ?? '', patient.nfcTag?.publicCode ?? ''].some((value) => normalizeText(value).includes(term)) &&
        (!species || patient.species === species) &&
        (!sex || patient.sex === sex),
    );
  },

  getGuardian: (guardianId: string): Promise<Guardian | undefined> => offlineDb.guardians.get(guardianId),

  async getTimeline(patientId: string): Promise<PaginatedTimeline | undefined> {
    const cached = await offlineDb.timelines.get(patientId);
    return cached?.timeline;
  },

  /** The "only mine" filter depends on assignments the copy may not reflect, so offline it shows the whole queue. */
  getPendingSchedule({ hospitalizationId }: PendingScheduleQuery = {}): Promise<PendingScheduleItem[]> {
    return hospitalizationId ? offlineDb.schedule.where('hospitalizationId').equals(hospitalizationId).toArray() : offlineDb.schedule.toArray();
  },
};
