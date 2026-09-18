import { IPrescription } from '../models/prescription.js';
import { IClinicalEvent } from '../models/clinical-event.js';
import { IPrescriptionItem } from '../models/prescription.js';

export interface IBedsideGuardian {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  cpf?: string | null;
}

export interface IBedsidePatient {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  weightKg?: number | string | null;
  photoUrl?: string | null;
  allergies?: string | null;
  isFasting: boolean;
  behaviorNotes?: string | null;
  guardian: IBedsideGuardian;
}

export interface IBedsideKennel {
  id: string;
  name: string;
  notes?: string | null;
}

export interface IBedsideQuickRecord {
  hospitalizationId: string;
  kennel: IBedsideKennel;
  patient: IBedsidePatient;
  prescriptions: IPrescription[];
  clinicalEvents: IClinicalEvent[];
}

export interface IApplyPrescriptionItemPayload {
  bedsideNotes?: string;
  metrics?: Record<string, any>;
}

export interface IApplyPrescriptionItemResponse {
  message: string;
  prescriptionItem: IPrescriptionItem;
  clinicalEvent: IClinicalEvent;
}
