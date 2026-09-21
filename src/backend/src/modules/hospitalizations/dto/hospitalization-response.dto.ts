import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HospitalizationStatus } from '@prisma/client';

export class HospitalizationGuardianSummaryDto {
  @ApiProperty({ example: 'uuid-guardian-1' })
  id: string;

  @ApiProperty({ example: 'Mariana Silva' })
  name: string;

  @ApiProperty({ example: '(15) 99876-5432' })
  phone: string;

  @ApiPropertyOptional({ example: 'mariana.silva@email.com' })
  email?: string | null;
}

export class HospitalizationPatientSummaryDto {
  @ApiProperty({ example: 'uuid-patient-1' })
  id: string;

  @ApiProperty({ example: 'Thor' })
  name: string;

  @ApiProperty({ example: 'Canina' })
  species: string;

  @ApiPropertyOptional({ example: 'Golden Retriever' })
  breed?: string | null;

  @ApiPropertyOptional({ example: 32.5 })
  weightKg?: any;

  @ApiProperty({ example: false, description: 'Indica se o paciente deve permanecer em jejum' })
  isFasting: boolean;

  @ApiProperty({ example: true, description: 'Indica se o paciente é castrado' })
  isCastrated: boolean;

  @ApiPropertyOptional({ example: 'Alergia a Dipirona' })
  allergies?: string | null;

  @ApiPropertyOptional({ example: 'Dócil, mas estressado com contenção' })
  behaviorNotes?: string | null;

  @ApiPropertyOptional({ type: () => HospitalizationGuardianSummaryDto })
  guardian?: HospitalizationGuardianSummaryDto | null;
}

export class HospitalizationKennelSummaryDto {
  @ApiProperty({ example: 'uuid-kennel-1' })
  id: string;

  @ApiProperty({ example: 'Baia 02 - Canil Médio' })
  name: string;

  @ApiPropertyOptional({ example: 'Baia com aquecimento' })
  notes?: string | null;
}

export class HospitalizationTagSummaryDto {
  @ApiProperty({ example: 'uuid-tag-1' })
  id: string;

  @ApiProperty({ example: '04A23B89C16080' })
  tagUid: string;

  @ApiProperty({ example: 'tag-thor-01' })
  publicCode: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 'https://app.suaclinica.com/bedside/tag-thor-01' })
  targetUrl: string;
}

export class HospitalizationClinicalEventSummaryDto {
  @ApiProperty({ example: 'uuid-event-1' })
  id: string;

  @ApiProperty({ example: 'OBSERVATION' })
  eventType: string;

  @ApiProperty({ example: 'Admissão Hospitalar (Check-in)' })
  title: string;

  @ApiPropertyOptional({ example: 'Paciente admitido com desidratação.' })
  description?: string | null;

  @ApiPropertyOptional()
  metrics?: any;

  @ApiProperty()
  recordedAt: Date;
}

export class HospitalizationResponseDto {
  @ApiProperty({ example: 'uuid-hosp-1' })
  id: string;

  @ApiProperty({ example: 'uuid-patient-1' })
  patientId: string;

  @ApiProperty({ example: 'uuid-kennel-1' })
  kennelId: string;

  @ApiPropertyOptional({ example: 'uuid-tag-1' })
  nfcTagId?: string | null;

  @ApiPropertyOptional({ example: 'Pós-operatório ortopédico' })
  admissionReason?: string | null;

  @ApiProperty({ enum: HospitalizationStatus, example: HospitalizationStatus.ACTIVE })
  status: HospitalizationStatus;

  @ApiProperty()
  admissionDate: Date;

  @ApiPropertyOptional()
  dischargeDate?: Date | null;

  @ApiProperty({
    example: ['JEJUM OBRIGATÓRIO', 'ALERGIA: Dipirona'],
    description: 'Alertas clínicos imediatos para visualização rápida no painel',
  })
  clinicalAlerts: string[];

  @ApiProperty({ type: () => HospitalizationPatientSummaryDto })
  patient: HospitalizationPatientSummaryDto;

  @ApiProperty({ type: () => HospitalizationKennelSummaryDto })
  kennel: HospitalizationKennelSummaryDto;

  @ApiPropertyOptional({ type: () => HospitalizationTagSummaryDto })
  nfcTag?: HospitalizationTagSummaryDto | null;

  @ApiPropertyOptional({ type: () => [HospitalizationClinicalEventSummaryDto] })
  clinicalEvents?: HospitalizationClinicalEventSummaryDto[];
}

export class LinkTagResponseDto {
  @ApiProperty({ example: 'Tag NFC vinculada ao paciente com sucesso.' })
  message: string;

  @ApiProperty({ type: () => HospitalizationResponseDto })
  hospitalization: HospitalizationResponseDto;
}

export class UnlinkTagResponseDto {
  @ApiProperty({ example: 'Tag NFC desvinculada com sucesso. A tag agora está disponível no inventário.' })
  message: string;

  @ApiProperty({ example: 'uuid-hosp-1' })
  hospitalizationId: string;

  @ApiPropertyOptional({ example: '04A23B89C16080' })
  freedTagUid?: string | null;

  @ApiPropertyOptional({ example: 'tag-thor-01' })
  freedPublicCode?: string | null;
}

export class TransferKennelResponseDto {
  @ApiProperty({ example: 'Transferência de baia realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 'uuid-kennel-old' })
  fromKennelId: string;

  @ApiProperty({ example: 'uuid-kennel-new' })
  toKennelId: string;

  @ApiProperty({ type: () => HospitalizationResponseDto })
  hospitalization: HospitalizationResponseDto;
}

export class DischargeResponseDto {
  @ApiProperty({ example: 'Alta hospitalar realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 'uuid-hosp-1' })
  hospitalizationId: string;

  @ApiProperty({ example: HospitalizationStatus.DISCHARGED, enum: HospitalizationStatus })
  status: HospitalizationStatus;

  @ApiPropertyOptional({ example: 'MEDICAL_DISCHARGE' })
  dischargeReason?: string | null;

  @ApiProperty({ type: () => HospitalizationPatientSummaryDto })
  patient: HospitalizationPatientSummaryDto;

  @ApiProperty()
  dischargeDate: Date;

  @ApiPropertyOptional({ example: '04A23B89C16080' })
  freedTagUid?: string | null;

  @ApiPropertyOptional({ example: 'tag-thor-01' })
  freedPublicCode?: string | null;
}
