import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FinancialStatus,
  HospitalizationStatus,
  PatientSex,
} from '@prisma/client';

export class PatientGuardianFinancialDto {
  @ApiProperty({ enum: FinancialStatus, example: FinancialStatus.PAID })
  status: FinancialStatus;

  @ApiProperty({ example: 'Boleto' })
  paymentMethod: string;
}

export class PatientGuardianDto {
  @ApiProperty({ example: 'uuid-guardian-1' })
  id: string;

  @ApiProperty({ example: 'Carlos Eduardo Santos' })
  name: string;

  @ApiPropertyOptional({ example: '123.456.789-01', nullable: true })
  cpf?: string | null;

  @ApiPropertyOptional({ example: 'carlos.santos@email.com', nullable: true })
  email?: string | null;

  @ApiProperty({ example: '(15) 99123-4567' })
  phone: string;

  @ApiPropertyOptional({
    example: 'Rua das Palmeiras, 450 - Sorocaba/SP',
    nullable: true,
  })
  address?: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  photoUrl?: string | null;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;

  @ApiPropertyOptional({
    type: () => PatientGuardianFinancialDto,
    nullable: true,
  })
  financial?: PatientGuardianFinancialDto | null;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  updatedAt: Date;
}

export class PatientNfcTagDto {
  @ApiProperty({ example: 'uuid-tag-1' })
  id: string;

  @ApiProperty({ example: '04A1B2C3D48831' })
  tagUid: string;

  @ApiProperty({ example: 'VET-8831' })
  publicCode: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  createdAt: Date;
}

export class PatientActiveKennelDto {
  @ApiProperty({ example: 'uuid-kennel-1' })
  id: string;

  @ApiProperty({ example: 'Baia 01 - UTI Canina' })
  name: string;
}

export class PatientActiveHospitalizationDto {
  @ApiProperty({ example: 'uuid-hosp-1' })
  id: string;

  @ApiProperty({ enum: HospitalizationStatus, example: HospitalizationStatus.ACTIVE })
  status: HospitalizationStatus;

  @ApiProperty({ example: '2026-10-10T08:00:00.000Z' })
  admissionDate: Date;

  @ApiPropertyOptional({
    example: 'Gastroenterite aguda com desidratação moderada',
    nullable: true,
  })
  admissionReason?: string | null;

  @ApiPropertyOptional({ type: () => PatientActiveKennelDto, nullable: true })
  kennel?: PatientActiveKennelDto | null;
}

export class PatientResponseDto {
  @ApiProperty({ example: 'uuid-patient-1' })
  id: string;

  @ApiProperty({ example: 'uuid-guardian-1' })
  guardianId: string;

  @ApiProperty({ example: 'Thor' })
  name: string;

  @ApiProperty({ example: 'Canina' })
  species: string;

  @ApiPropertyOptional({ example: 'Golden Retriever', nullable: true })
  breed?: string | null;

  @ApiPropertyOptional({ enum: PatientSex, example: PatientSex.MALE, nullable: true })
  sex?: PatientSex | null;

  @ApiPropertyOptional({ example: '2022-04-10T00:00:00.000Z', nullable: true })
  birthDate?: Date | null;

  @ApiPropertyOptional({ example: 'DEA 1.1+', nullable: true })
  bloodType?: string | null;

  @ApiPropertyOptional({ example: 32.5, nullable: true })
  weightKg?: number | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  photoUrl?: string | null;

  @ApiPropertyOptional({ example: 'Alérgico a Dipirona e Sulfas', nullable: true })
  allergies?: string | null;

  @ApiPropertyOptional({ example: ['Dermatite atópica'], type: [String] })
  treatments?: string[];

  @ApiProperty({ example: true })
  isFasting: boolean;

  @ApiProperty({ example: true })
  isCastrated: boolean;

  @ApiPropertyOptional({
    example: 'Dócil, porém assustado com manipulação de patas traseiras',
    nullable: true,
  })
  behaviorNotes?: string | null;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => PatientGuardianDto })
  guardian?: PatientGuardianDto;

  @ApiPropertyOptional({ type: () => PatientNfcTagDto, nullable: true })
  nfcTag?: PatientNfcTagDto | null;

  @ApiPropertyOptional({ type: () => PatientActiveHospitalizationDto, nullable: true })
  activeHospitalization?: PatientActiveHospitalizationDto | null;
}

export class PatientVisitResponseDto {
  @ApiProperty({ example: 'uuid-hosp-1', description: 'ID do atendimento/internação' })
  id: string;

  @ApiProperty({ example: '2026-10-10T14:00:00.000Z', description: 'Data e hora do atendimento' })
  visitedAt: Date;

  @ApiProperty({ type: () => PatientResponseDto })
  patient: PatientResponseDto;
}
