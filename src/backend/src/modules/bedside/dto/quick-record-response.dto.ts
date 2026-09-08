import { BedsidePatientDto } from './bedside-patient-response.dto';

export class QuickRecordResponseDto {
  hospitalizationId: string;
  kennelIdentifier: string;
  patient: BedsidePatientDto;
  prescriptions: any[];
}
