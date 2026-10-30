import type { CachedTimeline } from '@/db/offline-database';
import type { Guardian } from '@/interfaces/guardian.types';
import type { Patient } from '@/interfaces/patient.types';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';

import { guardianService } from './guardian.service';
import { hospitalizationService } from './hospitalization.service';
import { patientService } from './patient.service';
import { prescriptionService } from './prescription.service';

export interface HospitalizedSnapshot {
  patients: Patient[];
  guardians: Guardian[];
  schedule: PendingScheduleItem[];
  timelines: CachedTimeline[];
}

/** Billing is not needed at the bedside and should not sit on shared devices. */
const withoutFinancial = ({ financial: _financial, ...guardian }: Guardian): Guardian => guardian;

export const offlineSnapshotService = {
  /**
   * Everything the bedside needs about the hospitalized patients, built from the existing endpoints
   * (one request per patient and guardian). Pending API: GET /hospitalizations/active/snapshot would do it in one call.
   */
  async getHospitalizedSnapshot(): Promise<HospitalizedSnapshot> {
    const [patients, schedule] = await Promise.all([
      patientService.search({ hospitalized: true }),
      prescriptionService.getPendingSchedule({ includeOverdue: true }),
    ]);
    const guardianIds = [...new Set(patients.map(({ guardianId }) => guardianId))];

    const [guardians, timelines] = await Promise.all([
      Promise.all(guardianIds.map((guardianId) => guardianService.getById(guardianId))),
      Promise.all(
        patients.map(async ({ id }) => ({ patientId: id, timeline: await hospitalizationService.getPatientTimeline(id) })),
      ),
    ]);

    return { patients, guardians: guardians.map(withoutFinancial), schedule, timelines };
  },
};
