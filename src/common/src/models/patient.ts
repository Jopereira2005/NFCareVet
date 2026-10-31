import { PatientSex } from '../enums/index.js';
import { IGuardian } from './guardian.js';

export type PatientSexValue = `${PatientSex}` | PatientSex;

export interface IPatient {
  id: string;
  guardianId: string;
  name: string;
  species: string;
  breed?: string | null;
  sex?: PatientSexValue | null;
  birthDate?: Date | string | null;
  bloodType?: string | null;
  weightKg?: number | string | null;
  photoUrl?: string | null;
  allergies?: string | null;
  treatments?: string[];
  isFasting: boolean;
  isCastrated: boolean;
  behaviorNotes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  guardian?: IGuardian;
}

export interface ICreatePatientPayload {
  guardianId: string;
  name: string;
  species: string;
  breed?: string;
  sex?: PatientSexValue;
  birthDate?: Date | string;
  bloodType?: string;
  weightKg?: number;
  photoUrl?: string;
  allergies?: string;
  treatments?: string[];
  isFasting?: boolean;
  isCastrated?: boolean;
  behaviorNotes?: string;
}

export interface IUpdatePatientPayload {
  guardianId?: string;
  name?: string;
  species?: string;
  breed?: string;
  sex?: PatientSexValue | null;
  birthDate?: Date | string | null;
  bloodType?: string | null;
  weightKg?: number;
  photoUrl?: string;
  allergies?: string;
  treatments?: string[];
  isFasting?: boolean;
  isCastrated?: boolean;
  behaviorNotes?: string;
}
