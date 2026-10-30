import type { NfcTagUsage } from '@/interfaces/dashboard.types';
import type { TemporalSummary } from '@/interfaces/hospitalization.types';

import { daysAgoAt } from './mock-dates';

export const TEMPORAL_SUMMARY_MOCK: TemporalSummary = {
  today: { admittedCount: 1, dischargedCount: 0, activeCount: 8 },
  thisWeek: { admittedCount: 12, dischargedCount: 9 },
  thisMonth: { admittedCount: 123, dischargedCount: 115 },
  currentlyActive: 8,
  totalKennels: 12,
  occupancyRatePercentage: 66.7,
};

export const NFC_TAG_USAGE_MOCK: NfcTagUsage = { total: 30, linked: 18 };

/** Patient id + when it was attended; joined with PATIENTS_MOCK by the service. */
export const PATIENT_VISITS_MOCK = [
  { id: 'visit-1', patientId: 'pet-8831', visitedAt: daysAgoAt(0, 17) },
  { id: 'visit-2', patientId: 'pet-4190', visitedAt: daysAgoAt(2, 14, 20) },
  { id: 'visit-3', patientId: 'pet-5127', visitedAt: daysAgoAt(3, 9, 10) },
  { id: 'visit-4', patientId: 'pet-6022', visitedAt: daysAgoAt(20, 11, 45) },
];
