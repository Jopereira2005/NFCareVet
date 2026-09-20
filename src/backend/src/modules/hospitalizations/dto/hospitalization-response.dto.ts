import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HospitalizationStatus } from '@prisma/client';

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

  @ApiProperty({ type: () => HospitalizationPatientSummaryDto })
  patient: HospitalizationPatientSummaryDto;

  @ApiProperty({ type: () => HospitalizationKennelSummaryDto })
  kennel: HospitalizationKennelSummaryDto;

  @ApiPropertyOptional({ type: () => HospitalizationTagSummaryDto })
  nfcTag?: HospitalizationTagSummaryDto | null;
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
