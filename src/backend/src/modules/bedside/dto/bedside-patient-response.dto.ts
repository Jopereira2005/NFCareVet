export class BedsideGuardianDto {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  cpf?: string | null;
}

export class BedsidePatientDto {
  id: string;
  name: string;
  species: string;
  breed?: string | null;
  weightKg?: number | any | null;
  photoUrl?: string | null;
  allergies?: string | null;
  isFasting: boolean;
  behaviorNotes?: string | null;
  guardian: BedsideGuardianDto;
}
