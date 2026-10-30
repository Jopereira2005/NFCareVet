import type { Patient } from '@/interfaces/patient.types';

export type ObservationType = 'allergy' | 'treatment' | 'behavior';

export interface PatientObservation {
  type: ObservationType;
  label: string;
}

export const splitList = (value: string | null | undefined) =>
  (value ?? '')
    .split(/[,;]/)
    .map((item) => item.trim())
    .filter(Boolean);

/** Builds the record's observation tags from the free-text clinical fields of the patient. */
export function getPatientObservations({
  allergies,
  treatments,
  behaviorNotes,
}: Pick<Patient, 'allergies' | 'treatments' | 'behaviorNotes'>): PatientObservation[] {
  return [
    ...splitList(allergies).map((allergy) => ({ type: 'allergy' as const, label: `Alergia a ${allergy}` })),
    ...(treatments ?? []).map((treatment) => ({ type: 'treatment' as const, label: `Tratamento ${treatment.toLowerCase()}` })),
    ...(behaviorNotes ? [{ type: 'behavior' as const, label: behaviorNotes }] : []),
  ];
}
