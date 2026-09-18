import { EventType } from '../enums/index.js';
import { IUserSummary } from './user.js';
import type { IPrescriptionItem } from './prescription.js';

export interface IVitalSignsMetrics {
  temperature?: number; // em °C (ex: 38.5)
  heartRate?: number; // bpm
  respiratoryRate?: number; // mpm
  systolicBP?: number; // mmHg
  diastolicBP?: number; // mmHg
  meanBP?: number; // mmHg
  capillaryRefillTime?: string; // TPC (ex: "< 2s")
  bloodGlucose?: number; // mg/dL
  spo2?: number; // % saturação oxigênio
  painScore?: number; // Escala de dor 0-10
  notes?: string;
}

export interface IFeedingMetrics {
  foodType?: string;
  amountOfferedGrams?: number;
  amountConsumedGrams?: number;
  acceptedWell?: boolean;
}

export interface IEliminationMetrics {
  urination?: 'NORMAL' | 'INCREASED' | 'DECREASED' | 'ABSENT' | 'HEMATURIA';
  defecation?: 'NORMAL' | 'SOFT' | 'DIARRHEA' | 'HARD' | 'ABSENT' | 'MELENA';
  vomiting?: boolean;
  vomitCount?: number;
  notes?: string;
}

export type ClinicalMetrics =
  | IVitalSignsMetrics
  | IFeedingMetrics
  | IEliminationMetrics
  | Record<string, any>;

export interface IClinicalEvent {
  id: string;
  hospitalizationId: string;
  prescriptionItemId?: string | null;
  userId: string;
  eventType: EventType;
  title: string;
  description?: string | null;
  metrics?: ClinicalMetrics | null;
  recordedAt: Date | string;

  user?: IUserSummary;
  prescriptionItem?: IPrescriptionItem | null;
}

export interface ICreateClinicalEventPayload {
  hospitalizationId: string;
  prescriptionItemId?: string;
  eventType: EventType;
  title: string;
  description?: string;
  metrics?: ClinicalMetrics;
  recordedAt?: Date | string;
}
