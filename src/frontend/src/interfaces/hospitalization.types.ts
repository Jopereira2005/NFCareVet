import type { ICreateHospitalizationPayload } from '@nfcarevet/common';

import type { Patient } from './patient.types';

export interface TemporalMetrics {
  admittedCount: number;
  dischargedCount: number;
}

/** Mirrors `TemporalSummaryResponseDto` from GET /hospitalizations/stats/summary. */
export interface TemporalSummary {
  today: TemporalMetrics & { activeCount: number };
  thisWeek: TemporalMetrics;
  thisMonth: TemporalMetrics;
  currentlyActive: number;
  totalKennels: number;
  occupancyRatePercentage: number;
}

export type HistoryPeriod = 'today' | 'week' | 'month';

/** Pending API: patients attended in a period (admissions, consultations, NFC reads). */
export interface PatientVisit {
  id: string;
  patient: Patient;
  visitedAt: string;
}

/** Body of POST /hospitalizations (`CreateHospitalizationDto`). */
export type AdmitPatientPayload = Required<Pick<ICreateHospitalizationPayload, 'patientId' | 'kennelId' | 'admissionReason' | 'preliminaryDiagnosis'>> &
  Pick<ICreateHospitalizationPayload, 'tagIdentifier'>;
