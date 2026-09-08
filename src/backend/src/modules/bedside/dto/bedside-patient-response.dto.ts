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
}
