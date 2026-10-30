import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

import { Badge } from '@/components/ui/badge/Badge';
import { PetCard } from '@/components/ui/pet-card/PetCard';
import type { Patient } from '@/interfaces/patient.types';
import { getPatientRecordPath } from '@/router/paths';
import { formatShortName } from '@/utils/formatShortName';
import { getPatientStatusBadge } from '@/utils/getPatientStatusBadge';

type PatientCardProps = {
  patient: Patient;
  /** Overrides the default "breed • Tutor: name" line. */
  description?: string;
  /** Overrides the status badge, e.g. with the visit time. */
  aside?: ReactNode;
  eyebrow?: ReactNode;
};

/** PetCard fed by a `Patient`: builds the texts, the status badge and the link to the record. */
export function PatientCard({ patient, description, aside, eyebrow }: PatientCardProps) {
  const navigate = useNavigate();
  const statusBadge = getPatientStatusBadge(patient);
  const guardianLine = patient.guardian ? ` • Tutor(a): ${formatShortName(patient.guardian.name)}` : '';

  return (
    <PetCard
      eyebrow={eyebrow}
      name={patient.name}
      description={description ?? `${patient.breed ?? patient.species}${guardianLine}`}
      photoUrl={patient.photoUrl ?? undefined}
      tagCode={patient.nfcTag ? `#${patient.nfcTag.publicCode}` : 'Sem tag'}
      isTagActive={patient.nfcTag?.active ?? false}
      aside={aside ?? (statusBadge && <Badge label={statusBadge.label} tone={statusBadge.tone} />)}
      onAction={() => navigate(getPatientRecordPath(patient.id))}
    />
  );
}
