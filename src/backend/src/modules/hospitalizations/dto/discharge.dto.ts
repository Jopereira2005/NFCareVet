import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsEnum } from 'class-validator';
import { IDischargeHospitalizationPayload, DischargeReason } from '@nfcarevet/common';

export class DischargeDto implements IDischargeHospitalizationPayload {
  @ApiPropertyOptional({
    description: 'Motivo da alta hospitalar',
    enum: DischargeReason,
    example: DischargeReason.MEDICAL_DISCHARGE,
  })
  @IsEnum(DischargeReason, {
    message:
      'dischargeReason deve ser MEDICAL_DISCHARGE, EXTERNAL_TRANSFER, DECEASED ou OTHER.',
  })
  @IsOptional()
  dischargeReason?: DischargeReason;

  @ApiPropertyOptional({
    description: 'Evolução clínica final, instruções pós-alta ou notas médicas',
    example: 'Paciente estável, alimentando-se espontaneamente e sem queixas álgicas.',
  })
  @IsString({ message: 'dischargeNotes deve ser um texto.' })
  @IsOptional()
  @MaxLength(1000, { message: 'dischargeNotes não pode exceder 1000 caracteres.' })
  dischargeNotes?: string;

  @ApiPropertyOptional({
    description: 'Recomendações e cuidados prescritos para o tutor em domicílio',
    example: 'Manter antibioticoterapia oral por 7 dias e retornar para reavaliação.',
  })
  @IsString({ message: 'medicalRecommendations deve ser um texto.' })
  @IsOptional()
  @MaxLength(1000, { message: 'medicalRecommendations não pode exceder 1000 caracteres.' })
  medicalRecommendations?: string;
}
