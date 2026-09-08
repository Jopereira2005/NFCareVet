import { IsOptional, IsString } from 'class-validator';

export class ApplyMedicationDto {
  @IsString()
  @IsOptional()
  bedsideNotes?: string;
}
