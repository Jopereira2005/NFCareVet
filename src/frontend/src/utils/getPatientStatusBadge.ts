import { HospitalizationStatus } from '@nfcarevet/common';

import type { BadgeTone } from '@/components/ui/badge/Badge';
import type { Patient } from '@/interfaces/patient.types';

type PatientStatusBadge = { label: string; tone: BadgeTone };

/** Badge for the patient's current situation; `null` when there is nothing to flag. */
export function getPatientStatusBadge({ activeHospitalization }: Pick<Patient, 'activeHospitalization'>): PatientStatusBadge | null {
  if (activeHospitalization?.status === HospitalizationStatus.ACTIVE) return { label: 'Hospitalizado', tone: 'danger' };
  return null;
}
