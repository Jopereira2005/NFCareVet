import type { IKennel } from '@nfcarevet/common';

/** Kennel plus who is in it. Pending API: occupancy is not returned by the backend yet. */
export interface Kennel extends IKennel {
  occupant?: { patientId: string; patientName: string } | null;
}
