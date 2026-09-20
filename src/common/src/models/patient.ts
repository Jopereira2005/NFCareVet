import { IGuardian } from './guardian.js';

export interface IPatient {
  id: string;
  guardianId: string;
  name: string;
  species: string;
  breed?: string | null;
  weightKg?: number | string | null;
  photoUrl?: string | null;
  allergies?: string | null;
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
  weightKg?: number;
  photoUrl?: string;
  allergies?: string;
  isFasting?: boolean;
  isCastrated?: boolean;
  behaviorNotes?: string;
}

export interface IUpdatePatientPayload {
  guardianId?: string;
  name?: string;
  species?: string;
  breed?: string;
  weightKg?: number;
  photoUrl?: string;
  allergies?: string;
  isFasting?: boolean;
  isCastrated?: boolean;
  behaviorNotes?: string;
}
