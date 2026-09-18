import { BedsidePatientDto } from './bedside-patient-response.dto';

export class BedsideKennelDto {
  id: string;
  name: string;
  notes?: string | null;
}

export class QuickRecordResponseDto {
  hospitalizationId: string;
  kennel: BedsideKennelDto;
  patient: BedsidePatientDto;
  prescriptions: any[];
  clinicalEvents: any[];
}
