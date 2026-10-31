import { FinancialStatus } from '../enums/index.js';

export type FinancialStatusValue = `${FinancialStatus}` | FinancialStatus;

export interface IGuardianFinancial {
  status: FinancialStatusValue;
  paymentMethod: string;
}

export interface IGuardian {
  id: string;
  name: string;
  cpf?: string | null;
  email?: string | null;
  phone: string;
  address?: string | null;
  photoUrl?: string | null;
  isActive?: boolean;
  financial?: IGuardianFinancial | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICreateGuardianPayload {
  name: string;
  phone: string;
  cpf?: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  isActive?: boolean;
  financial?: IGuardianFinancial | null;
}

export interface IUpdateGuardianPayload {
  name?: string;
  phone?: string;
  cpf?: string;
  email?: string;
  address?: string;
  photoUrl?: string | null;
  isActive?: boolean;
  financial?: IGuardianFinancial | null;
}
