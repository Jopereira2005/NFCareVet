import type { Guardian } from './guardian.types';
import type { Patient } from './patient.types';

/** Pending API: NFC tag usage for the shift summary. */
export interface NfcTagUsage {
  total: number;
  linked: number;
}

/** Pending API: latest patients and guardians registered, newest first. */
export type RecentRegistration =
  | { kind: 'patient'; patient: Patient }
  | { kind: 'guardian'; guardian: Guardian };
