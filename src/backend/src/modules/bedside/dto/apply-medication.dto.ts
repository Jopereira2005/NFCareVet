import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class ApplyMedicationDto {
  @ApiPropertyOptional({
    example: 'Paciente calmo, administrou-se a dose sem intercorrências.',
    description: 'Observações clínicas feitas à beira do leito durante a administração',
  })
  @IsString()
  @IsOptional()
  bedsideNotes?: string;

  @ApiPropertyOptional({
    example: {
      temperature: 38.6,
      heartRate: 115,
      respiratoryRate: 26,
    },
    description: 'Métricas e sinais vitais aferidos no momento da checagem/administração',
  })
  @IsObject()
  @IsOptional()
  metrics?: Record<string, any>;
}

