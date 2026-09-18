import {
  AdministrationRoute,
  PrescriptionItemType,
  PrescriptionStatus,
} from '../enums/index.js';
import { IUserSummary } from './user.js';
import type { IClinicalEvent } from './clinical-event.js';

export interface IPrescriptionItem {
  id: string;
  prescriptionId: string;
  itemType: PrescriptionItemType;
  title: string;
  dosage?: string | null;
  route?: AdministrationRoute | null;
  scheduledTime: Date | string;
  status: PrescriptionStatus;
  instructions?: string | null;
  createdAt: Date | string;

  clinicalEvents?: IClinicalEvent[];
}

export interface IPrescription {
  id: string;
  hospitalizationId: string;
  prescribedById: string;
  generalRecommendations?: string | null;
  isActive: boolean;
  validUntil?: Date | string | null;
  createdAt: Date | string;

  prescribedBy?: IUserSummary;
  items?: IPrescriptionItem[];
}

export interface ICreatePrescriptionItemPayload {
  itemType: PrescriptionItemType;
  title: string;
  dosage?: string;
  route?: AdministrationRoute;
  scheduledTime: Date | string;
  instructions?: string;
}

export interface ICreatePrescriptionPayload {
  hospitalizationId: string;
  prescribedById: string;
  generalRecommendations?: string;
  validUntil?: Date | string;
  items: ICreatePrescriptionItemPayload[];
}
