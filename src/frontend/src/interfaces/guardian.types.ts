import type { ICreateGuardianPayload, IGuardian, IUpdateGuardianPayload } from '@nfcarevet/common';

import type { Patient } from './patient.types';

export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface GuardianFinancial {
  status: FinancialStatus;
  paymentMethod: string;
}

/**
 * Guardian as the screens consume it: the API model (`IGuardian`) plus its patients.
 * Fields marked "pending API" are not returned by the backend yet and stay optional.
 */
export interface Guardian extends IGuardian {
  patients?: Patient[];
  /** Pending API */
  address?: string | null;
  /** Pending API */
  financial?: GuardianFinancial | null;
  /** Pending API */
  photoUrl?: string | null;
  /** Pending API: active client of the clinic */
  isActive?: boolean;
}

/** Body of POST /guardians plus the fields still pending on the API. */
export type CreateGuardianPayload = ICreateGuardianPayload & Pick<Guardian, 'address'>;

/** Pending API: body of PATCH /guardians/:id. */
export type UpdateGuardianPayload = IUpdateGuardianPayload & Pick<Guardian, 'address'>;
