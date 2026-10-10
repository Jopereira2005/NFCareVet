import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class TimelineExecutorSummaryDto {
  @ApiProperty({ example: 'uuid-user-1' })
  id: string;

  @ApiProperty({ example: 'Dra. Camila Souza' })
  name: string;

  @ApiProperty({ example: 'VET' })
  role: string;
}

export class TimelineEventItemDto {
  @ApiProperty({ example: 'uuid-event-1' })
  id: string;

  @ApiProperty({ example: 'uuid-hosp-1' })
  hospitalizationId: string;

  @ApiProperty({ enum: EventType, example: EventType.VITAL_SIGNS })
  eventType: EventType;

  @ApiProperty({ example: 'Aferição de Sinais Vitais' })
  title: string;

  @ApiPropertyOptional({ example: 'Paciente alerta, normotérmico e sem dor aparente.' })
  description?: string | null;

  @ApiPropertyOptional({
    example: {
      temperature: 38.5,
      heartRate: 110,
      respiratoryRate: 24,
      systolicBP: 125,
      capillaryRefillTime: '< 2s',
      bloodGlucose: 98,
    },
    description: 'Métricas clínicas do evento (sinais vitais, alimentação ou eliminações)',
  })
  metrics?: Record<string, any> | null;

  @ApiProperty()
  recordedAt: Date;

  @ApiProperty({ type: () => TimelineExecutorSummaryDto })
  executor: TimelineExecutorSummaryDto;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 45, description: 'Total de registros encontrados' })
  total: number;

  @ApiProperty({ example: 1, description: 'Página atual' })
  page: number;

  @ApiProperty({ example: 10, description: 'Limite de registros por página' })
  limit: number;

  @ApiProperty({ example: 5, description: 'Total de páginas calculadas' })
  totalPages: number;

  @ApiProperty({ example: true, description: 'Indica se há uma próxima página' })
  hasNextPage: boolean;

  @ApiProperty({ example: false, description: 'Indica se há página anterior' })
  hasPreviousPage: boolean;
}

export class PaginatedTimelineResponseDto {
  @ApiProperty({ type: () => [TimelineEventItemDto] })
  items: TimelineEventItemDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;

  @ApiPropertyOptional({
    description: 'Última aferição de sinais vitais registrada para consulta rápida',
    example: {
      temperature: 38.5,
      heartRate: 110,
      respiratoryRate: 24,
      systolicBP: 125,
      recordedAt: '2026-10-10T16:30:00.000Z',
    },
  })
  latestVitalSigns?: Record<string, any> | null;
}
