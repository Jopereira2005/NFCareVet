import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PrescriptionItemType } from '@nfcarevet/common';

export class PendingScheduleQueryDto {
  @ApiPropertyOptional({
    description: 'Janela de tempo futura em horas para listar os itens programados',
    example: 4,
    default: 4,
    minimum: 1,
    maximum: 48,
  })
  @Type(() => Number)
  @IsInt({ message: 'windowHours deve ser um número inteiro.' })
  @Min(1, { message: 'windowHours deve ser no mínimo 1 hora.' })
  @Max(48, { message: 'windowHours não pode exceder 48 horas.' })
  @IsOptional()
  windowHours?: number = 4;

  @ApiPropertyOptional({
    description:
      'Se verdadeiro, inclui itens com horário programado no passado que ainda constam como PENDING (itens atrasados)',
    default: true,
    example: true,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return true;
    return value === 'true' || value === true || value === 1 || value === '1';
  })
  @IsBoolean({ message: 'includeOverdue deve ser um valor booleano.' })
  @IsOptional()
  includeOverdue?: boolean = true;

  @ApiPropertyOptional({
    description: 'Filtra os itens pendentes alocados em um canil/baia específico',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'kennelId deve ser um UUID válido.' })
  @IsOptional()
  kennelId?: string;

  @ApiPropertyOptional({
    description: 'Filtra os itens pendentes de uma internação específica',
    example: '4ba85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsUUID('4', { message: 'hospitalizationId deve ser um UUID válido.' })
  @IsOptional()
  hospitalizationId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por tipo específico de item prescrito',
    enum: PrescriptionItemType,
    example: PrescriptionItemType.MEDICATION,
  })
  @IsEnum(PrescriptionItemType, {
    message: 'itemType deve ser MEDICATION, PROCEDURE, VITAL_CHECK ou EXAM.',
  })
  @IsOptional()
  itemType?: PrescriptionItemType;
}
