import { HospitalizationStatus } from '../enums/index.js';
import { IPatient } from './patient.js';
import { IKennel } from './kennel.js';
import { INfcTag } from './nfc-tag.js';
import { IPrescription } from './prescription.js';
import { IClinicalEvent } from './clinical-event.js';

export interface IHospitalization {
  id: string;
  patientId: string;
  kennelId: string;
  nfcTagId?: string | null;
  admissionReason?: string | null;
  status: HospitalizationStatus;
  admissionDate: Date | string;
  dischargeDate?: Date | string | null;

  patient?: IPatient;
  kennel?: IKennel;
  nfcTag?: INfcTag | null;
  prescriptions?: IPrescription[];
  clinicalEvents?: IClinicalEvent[];
}

export interface ICreateHospitalizationPayload {
  patientId: string;
  kennelId: string;
  nfcTagId?: string;
  admissionReason?: string;
  status?: HospitalizationStatus;
  admissionDate?: Date | string;
}

export interface IUpdateHospitalizationPayload {
  kennelId?: string;
  nfcTagId?: string | null;
  admissionReason?: string;
  status?: HospitalizationStatus;
  dischargeDate?: Date | string | null;
}

export interface ILinkTagPayload {
  tagIdentifier: string;
}

export interface IUnlinkTagPayload {
  reason?: string;
}

