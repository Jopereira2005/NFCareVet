import { ApiProperty } from '@nestjs/swagger';

export class TemporalMetricsDto {
  @ApiProperty({ example: 4, description: 'Quantidade de novas admissões registradas no período' })
  admittedCount: number;

  @ApiProperty({ example: 2, description: 'Quantidade de altas concedidas no período' })
  dischargedCount: number;
}

export class TodayMetricsDto extends TemporalMetricsDto {
  @ApiProperty({ example: 8, description: 'Pacientes que estavam ou continuam ativos no dia de hoje' })
  activeCount: number;
}

export class TemporalSummaryResponseDto {
  @ApiProperty({
    description: 'Métricas do dia atual (Hoje)',
    type: () => TodayMetricsDto,
  })
  today: TodayMetricsDto;

  @ApiProperty({
    description: 'Métricas dos últimos 7 dias (Esta Semana)',
    type: () => TemporalMetricsDto,
  })
  thisWeek: TemporalMetricsDto;

  @ApiProperty({
    description: 'Métricas do mês atual (Este Mês)',
    type: () => TemporalMetricsDto,
  })
  thisMonth: TemporalMetricsDto;

  @ApiProperty({ example: 7, description: 'Total de pacientes internados atualmente' })
  currentlyActive: number;

  @ApiProperty({ example: 10, description: 'Capacidade total de baias cadastradas' })
  totalKennels: number;

  @ApiProperty({ example: 70.0, description: 'Taxa de ocupação hospitalar (%)' })
  occupancyRatePercentage: number;
}
