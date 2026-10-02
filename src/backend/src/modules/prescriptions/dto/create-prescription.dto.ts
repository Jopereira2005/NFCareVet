import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AdministrationRoute,
  PrescriptionItemType,
  ICreatePrescriptionItemPayload,
  ICreatePrescriptionPayload,
} from '@nfcarevet/common';

export class CreatePrescriptionItemDto implements ICreatePrescriptionItemPayload {
  @ApiProperty({
    description: 'Tipo do item prescrito (medicamento, procedimento, checagem de sinais vitais ou exame)',
    enum: PrescriptionItemType,
    example: PrescriptionItemType.MEDICATION,
    default: PrescriptionItemType.MEDICATION,
  })
  @IsEnum(PrescriptionItemType, {
    message: 'itemType deve ser MEDICATION, PROCEDURE, VITAL_CHECK ou EXAM.',
  })
  @IsNotEmpty({ message: 'itemType é obrigatório.' })
  itemType: PrescriptionItemType;

  @ApiProperty({
    description: 'Nome do medicamento, procedimento ou exame a ser realizado',
    example: 'Dipirona 500mg/mL',
    maxLength: 120,
  })
  @IsString({ message: 'title deve ser um texto.' })
  @IsNotEmpty({ message: 'title é obrigatório.' })
  @MaxLength(120, { message: 'title não pode exceder 120 caracteres.' })
  title: string;

  @ApiPropertyOptional({
    description: 'Dosagem ou volume da administração (ex.: 0.5 mL, 25 mg/kg)',
    example: '0.5 mL (25 mg/kg)',
    maxLength: 50,
  })
  @IsString({ message: 'dosage deve ser um texto.' })
  @IsOptional()
  @MaxLength(50, { message: 'dosage não pode exceder 50 caracteres.' })
  dosage?: string;

  @ApiPropertyOptional({
    description: 'Via de administração (aplicável principalmente a medicamentos)',
    enum: AdministrationRoute,
    example: AdministrationRoute.INTRAVENOUS,
  })
  @IsEnum(AdministrationRoute, {
    message:
      'route deve ser ORAL, SUBCUTANEOUS, INTRAVENOUS, INTRAMUSCULAR, TOPICAL ou INHALATION.',
  })
  @IsOptional()
  route?: AdministrationRoute;

  @ApiProperty({
    description: 'Horário programado para a administração ou checagem (formato ISO 8601 UTC)',
    example: '2026-09-27T08:00:00.000Z',
  })
  @IsDateString({}, { message: 'scheduledTime deve ser uma data/hora ISO 8601 válida.' })
  @IsNotEmpty({ message: 'scheduledTime é obrigatório.' })
  scheduledTime: string;

  @ApiPropertyOptional({
    description: 'Instruções técnicas para a equipe de enfermagem à beira de leito',
    example: 'Diluir em 10 mL de Solução Fisiológica 0,9% e infundir lentamente via IV em 15 minutos.',
    maxLength: 500,
  })
  @IsString({ message: 'instructions deve ser um texto.' })
  @IsOptional()
  @MaxLength(500, { message: 'instructions não pode exceder 500 caracteres.' })
  instructions?: string;
}

export class CreatePrescriptionDto implements Partial<ICreatePrescriptionPayload> {
  @ApiPropertyOptional({
    description:
      'UUID da internação ativa. Obrigatório se não for informado diretamente na rota (/hospitalizations/:id/prescriptions).',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'hospitalizationId deve ser um UUID válido.' })
  @IsOptional()
  hospitalizationId?: string;

  @ApiPropertyOptional({
    description:
      'UUID do médico veterinário prescritor. Se omitido, utiliza o ID do usuário autenticado no token JWT.',
    example: '5ca85f64-5717-4562-b3fc-2c963f66afa8',
  })
  @IsUUID('4', { message: 'prescribedById deve ser um UUID válido.' })
  @IsOptional()
  prescribedById?: string;

  @ApiPropertyOptional({
    description: 'Recomendações gerais e diretrizes clínicas para o plantão',
    example: 'Manter em aquecimento térmico com manta; monitorar diurese a cada 4 horas; manter jejum hídrico até novo aviso.',
    maxLength: 1000,
  })
  @IsString({ message: 'generalRecommendations deve ser um texto.' })
  @IsOptional()
  @MaxLength(1000, { message: 'generalRecommendations não pode exceder 1000 caracteres.' })
  generalRecommendations?: string;

  @ApiPropertyOptional({
    description: 'Data/hora limite de validade desta prescrição (formato ISO 8601 UTC)',
    example: '2026-09-28T08:00:00.000Z',
  })
  @IsDateString({}, { message: 'validUntil deve ser uma data/hora ISO 8601 válida.' })
  @IsOptional()
  validUntil?: string;

  @ApiPropertyOptional({
    description:
      'Indica se deve inativar automaticamente protocolos/prescrições anteriores ativas da mesma internação para evitar conflitos de dosagem.',
    default: true,
    example: true,
  })
  @IsBoolean({ message: 'autoDeactivatePrevious deve ser um valor booleano.' })
  @IsOptional()
  autoDeactivatePrevious?: boolean = true;

  @ApiProperty({
    description: 'Lista de medicamentos, procedimentos e checagens aprazadas que compõem a prescrição',
    type: [CreatePrescriptionItemDto],
  })
  @IsArray({ message: 'items deve ser uma lista de itens de prescrição.' })
  @ArrayMinSize(1, { message: 'A prescrição deve conter pelo menos um item programado.' })
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}
