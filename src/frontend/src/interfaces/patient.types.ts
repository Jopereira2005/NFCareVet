import type { HospitalizationStatus, ICreatePatientPayload, IGuardian, INfcTag, IPatient, IUpdatePatientPayload } from '@nfcarevet/common';

export type PatientSex = 'MALE' | 'FEMALE';

export interface PatientActiveHospitalization {
  id: string;
  status: HospitalizationStatus;
  admissionDate: string;
  admissionReason?: string | null;
  kennel?: { id: string; name: string } | null;
}

/**
 * Patient as the screens consume it: the API model (`IPatient`) plus its relations.
 * Fields marked "pending API" are not returned by the backend yet and stay optional.
 */
export interface Patient extends IPatient {
  guardian?: IGuardian;
  nfcTag?: INfcTag | null;
  activeHospitalization?: PatientActiveHospitalization | null;
  /** Pending API */
  sex?: PatientSex | null;
  /** Pending API: ongoing treatments shown as record observations. */
  treatments?: string[];
}

/** Body of POST /patients plus the fields still pending on the API. */
export type CreatePatientPayload = ICreatePatientPayload & Pick<Patient, 'sex'>;

/** Pending API: body of PATCH /patients/:id. */
export type UpdatePatientPayload = IUpdatePatientPayload & Pick<Patient, 'sex'>;
