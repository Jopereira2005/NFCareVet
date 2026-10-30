import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const HISTORY_PERIODS = ['today', 'week', 'month'] as const;
export type HistoryPeriod = (typeof HISTORY_PERIODS)[number];

export class PatientVisitsQueryDto {
  @ApiPropertyOptional({
    description: 'Período do histórico de atendimentos (today = hoje, week = últimos 7 dias, month = mês atual)',
    enum: HISTORY_PERIODS,
    default: 'today',
    example: 'today',
  })
  @IsIn(HISTORY_PERIODS, {
    message: 'period deve ser today, week ou month.',
  })
  @IsOptional()
  period?: HistoryPeriod = 'today';
}
