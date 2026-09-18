import { IsObject, IsOptional, IsString } from 'class-validator';

export class ApplyMedicationDto {
  @IsString()
  @IsOptional()
  bedsideNotes?: string;

  @IsObject()
  @IsOptional()
  metrics?: Record<string, any>;
}
