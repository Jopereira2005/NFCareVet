import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsDateString, Max, Min } from 'class-validator';
import { EventType } from '@prisma/client';

export class TimelineQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página (iniciando em 1)',
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro.' })
  @Min(1, { message: 'page deve ser no mínimo 1.' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Quantidade de registros por página (máx. 100)',
    default: 10,
    example: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro.' })
  @Min(1, { message: 'limit deve ser no mínimo 1.' })
  @Max(100, { message: 'limit não pode exceder 100.' })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de evento clínico (ex: VITAL_SIGNS, MEDICATION_APPLICATION, etc.)',
    enum: EventType,
    example: EventType.VITAL_SIGNS,
  })
  @IsEnum(EventType, { message: 'eventType inválido.' })
  @IsOptional()
  eventType?: EventType;

  @ApiPropertyOptional({
    description: 'Data de início para filtro cronológico (ISO 8601)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsDateString({}, { message: 'startDate deve ser uma data válida em formato ISO.' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de término para filtro cronológico (ISO 8601)',
    example: '2026-10-10T23:59:59.999Z',
  })
  @IsDateString({}, { message: 'endDate deve ser uma data válida em formato ISO.' })
  @IsOptional()
  endDate?: string;
}
