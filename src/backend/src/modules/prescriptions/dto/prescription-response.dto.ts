import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AdministrationRoute,
  PrescriptionItemType,
  PrescriptionStatus,
  UserRole,
} from '@prisma/client';
import {
  IUserSummary,
  IPrescriptionItem,
  IPrescription,
} from '@nfcarevet/common';

export class PrescriptionUserSummaryDto {
  @ApiProperty({ example: 'uuid-user-1' })
  id: string;

  @ApiProperty({ example: 'Dra. Camila Santos' })
  name: string;

  @ApiProperty({ example: 'camila.santos@suaclinica.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VET })
  role: UserRole;
}

export class PrescriptionItemResponseDto {
  @ApiProperty({ example: 'uuid-item-1' })
  id: string;

  @ApiProperty({ example: 'uuid-prescription-1' })
  prescriptionId: string;

  @ApiProperty({
    enum: PrescriptionItemType,
    example: PrescriptionItemType.MEDICATION,
  })
  itemType: PrescriptionItemType;

  @ApiProperty({ example: 'Dipirona 500mg/mL' })
  title: string;

  @ApiPropertyOptional({ example: '0.5 mL (25 mg/kg)' })
  dosage?: string | null;

  @ApiPropertyOptional({
    enum: AdministrationRoute,
    example: AdministrationRoute.INTRAVENOUS,
  })
  route?: AdministrationRoute | null;

  @ApiProperty({ example: '2026-09-27T08:00:00.000Z' })
  scheduledTime: Date | string;

  @ApiProperty({
    enum: PrescriptionStatus,
    example: PrescriptionStatus.PENDING,
  })
  status: PrescriptionStatus;

  @ApiPropertyOptional({
    example: 'Diluir em 10 mL de SF 0,9% e infundir lentamente.',
  })
  instructions?: string | null;

  @ApiProperty({ example: '2026-09-26T22:30:00.000Z' })
  createdAt: Date | string;

  @ApiPropertyOptional({
    description: 'Sinaliza se o item está com horário programado ultrapassado e ainda não foi aplicado',
    example: false,
  })
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Data e hora em que a aplicação/checagem foi realizada à beira do leito',
    example: '2026-09-27T08:05:00.000Z',
  })
  appliedAt?: Date | string | null;

  @ApiPropertyOptional({
    description: 'Profissional executor que registrou a aplicação',
    type: () => PrescriptionUserSummaryDto,
  })
  appliedBy?: PrescriptionUserSummaryDto | null;
}

export class PrescriptionResponseDto {
  @ApiProperty({ example: 'uuid-prescription-1' })
  id: string;

  @ApiProperty({ example: 'uuid-hosp-1' })
  hospitalizationId: string;

  @ApiProperty({ example: 'uuid-vet-1' })
  prescribedById: string;

  @ApiPropertyOptional({
    example: 'Manter em aquecimento térmico com manta; monitorar diurese a cada 4 horas.',
  })
  generalRecommendations?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2026-09-28T08:00:00.000Z' })
  validUntil?: Date | string | null;

  @ApiProperty({ example: '2026-09-26T22:30:00.000Z' })
  createdAt: Date | string;

  @ApiPropertyOptional({ type: () => PrescriptionUserSummaryDto })
  prescribedBy?: PrescriptionUserSummaryDto;

  @ApiProperty({
    type: [PrescriptionItemResponseDto],
    description: 'Itens aprazados desta prescrição médica',
  })
  items: PrescriptionItemResponseDto[];
}

export class CancelItemResponseDto {
  @ApiProperty({ example: 'Item de prescrição cancelado com sucesso.' })
  message: string;

  @ApiProperty({ type: PrescriptionItemResponseDto })
  item: PrescriptionItemResponseDto;

  @ApiPropertyOptional({
    description: 'ID do evento clínico de auditoria gerado no prontuário',
    example: 'uuid-clinical-event-1',
  })
  clinicalEventId?: string;
}

export class DeactivatePrescriptionResponseDto {
  @ApiProperty({ example: 'Prescrição inativada com sucesso.' })
  message: string;

  @ApiProperty({ type: PrescriptionResponseDto })
  prescription: PrescriptionResponseDto;

  @ApiProperty({
    description: 'Quantidade de itens pendentes que foram cancelados automaticamente',
    example: 3,
  })
  cancelledItemsCount: number;
}

export class SchedulePatientSummaryDto {
  @ApiProperty({ example: 'uuid-patient-1' })
  id: string;

  @ApiProperty({ example: 'Thor' })
  name: string;

  @ApiProperty({ example: 'Canina' })
  species: string;

  @ApiPropertyOptional({ example: 'Golden Retriever' })
  breed?: string | null;

  @ApiProperty({ example: false })
  isFasting: boolean;

  @ApiPropertyOptional({ example: 'Alergia a Dipirona' })
  allergies?: string | null;

  @ApiPropertyOptional({ example: 'Reativo a manipulação abdominal' })
  behaviorNotes?: string | null;
}

export class ScheduleKennelSummaryDto {
  @ApiProperty({ example: 'uuid-kennel-1' })
  id: string;

  @ApiProperty({ example: 'Canil 02 - Porte Grande' })
  name: string;
}

export class PendingScheduleItemResponseDto {
  @ApiProperty({ type: () => PrescriptionItemResponseDto })
  item: PrescriptionItemResponseDto;

  @ApiProperty({ example: 'uuid-hosp-1' })
  hospitalizationId: string;

  @ApiProperty({ type: () => SchedulePatientSummaryDto })
  patient: SchedulePatientSummaryDto;

  @ApiProperty({ type: () => ScheduleKennelSummaryDto })
  kennel: ScheduleKennelSummaryDto;

  @ApiProperty({
    description: 'Indica se o item está atrasado em relação ao horário atual',
    example: false,
  })
  isOverdue: boolean;

  @ApiPropertyOptional({
    description: 'Minutos de atraso (se isOverdue for verdadeiro)',
    example: 25,
  })
  minutesOverdue?: number;
}
