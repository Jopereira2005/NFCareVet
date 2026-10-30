import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateClinicalEventDto {
  @ApiProperty({
    description: 'Título descritivo do evento clínico',
    example: 'Sinais Vitais Registrados',
    minLength: 3,
    maxLength: 120,
  })
  @IsString({ message: 'O título deve ser um texto.' })
  @IsNotEmpty({ message: 'O título é obrigatório.' })
  @MinLength(3, { message: 'O título deve ter pelo menos 3 caracteres.' })
  @MaxLength(120, { message: 'O título deve ter no máximo 120 caracteres.' })
  title!: string;

  @ApiPropertyOptional({
    description: 'Descrição / observações livres do evento clínico',
    example: 'Paciente alerta e normotérmico.',
    maxLength: 500,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto.' })
  @MaxLength(500, { message: 'A descrição deve ter no máximo 500 caracteres.' })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Métricas clínicas aferidas (ex.: FC, FR, temperatura, PAS, PAD, TPC, observações)',
    example: {
      heartRate: 96,
      respiratoryRate: 24,
      temperature: 38.6,
      systolicBP: 120,
      diastolicBP: 80,
      capillaryRefillTime: '< 2s',
      notes: 'Mucosas normocoradas.',
    },
    nullable: true,
  })
  @IsOptional()
  @IsObject({ message: 'As métricas devem ser um objeto JSON válido.' })
  metrics?: Record<string, unknown> | null;

  @ApiProperty({
    description: 'Data e horário da realização do evento clínico (ISO 8601)',
    example: '2026-10-30T00:30:00.000Z',
  })
  @IsDateString({}, { message: 'recordedAt deve ser uma data/hora ISO 8601 válida.' })
  @IsNotEmpty({ message: 'recordedAt é obrigatório.' })
  recordedAt!: string;
}
