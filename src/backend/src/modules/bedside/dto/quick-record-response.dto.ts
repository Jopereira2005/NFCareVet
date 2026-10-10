import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BedsidePatientDto } from './bedside-patient-response.dto';

export class BedsideNfcTagDto {
  @ApiProperty({ example: 'tag-uuid-1', description: 'ID interno da tag NFC' })
  id: string;

  @ApiProperty({ example: '04A23B89C16080', description: 'UID físico do chip NFC da coleira' })
  tagUid: string;

  @ApiProperty({ example: 'tag-thor-01', description: 'Código público/slug associado' })
  publicCode: string;
}

export class BedsideKennelDto {
  @ApiProperty({ example: 'k1-4712-4cf4-912b-2a76f2d24a91', description: 'ID do canil/baia' })
  id: string;

  @ApiProperty({ example: 'Canil 01 - UTI', description: 'Identificação ou nome da baia onde o paciente está alojado' })
  name: string;

  @ApiPropertyOptional({ example: 'Equipado com ponto de oxigênio', nullable: true, description: 'Observações do leito' })
  notes?: string | null;
}

export class BedsidePendingTaskDto {
  @ApiProperty({ example: 'uuid-item-1', description: 'ID do item da prescrição médica' })
  id: string;

  @ApiProperty({ example: 'MEDICATION', description: 'Tipo do item (MEDICATION, PROCEDURE, VITAL_CHECK, EXAM)' })
  itemType: string;

  @ApiProperty({ example: 'Dipirona 500mg/ml', description: 'Nome do medicamento ou procedimento' })
  title: string;

  @ApiPropertyOptional({ example: '0.8 ml', description: 'Dosagem prescrita' })
  dosage?: string | null;

  @ApiPropertyOptional({ example: 'INTRAVENOUS', description: 'Via de administração' })
  route?: string | null;

  @ApiProperty({ example: '2026-10-10T18:00:00.000Z', description: 'Horário programado para aplicação' })
  scheduledTime: Date;

  @ApiProperty({ example: false, description: 'Indica se a dose está atrasada em relação ao horário atual' })
  isOverdue: boolean;

  @ApiPropertyOptional({ example: 'Aplicar lentamente IV', description: 'Instruções de administração' })
  instructions?: string | null;
}

export class QuickRecordResponseDto {
  @ApiProperty({ example: 'hosp-1234-5678-90ab-cdef12345678', description: 'ID da internação ativa' })
  hospitalizationId: string;

  @ApiPropertyOptional({ example: 'Gastroenterite com desidratação', description: 'Motivo da admissão' })
  admissionReason?: string | null;

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z', description: 'Data de admissão do paciente' })
  admissionDate: Date;

  @ApiProperty({
    example: ['JEJUM OBRIGATÓRIO', 'ALERGIA: Dipirona', 'TIPO SANGUÍNEO: DEA 1.1+'],
    description: 'Alertas clínicos rápidos para exibição em badges visuais no aplicativo',
  })
  clinicalAlerts: string[];

  @ApiPropertyOptional({ type: () => BedsideNfcTagDto, description: 'Dados da tag NFC da coleira do animal' })
  nfcTag?: BedsideNfcTagDto | null;

  @ApiProperty({ type: () => BedsideKennelDto, description: 'Informações da baia/canil onde o paciente está alojado' })
  kennel: BedsideKennelDto;

  @ApiProperty({ type: () => BedsidePatientDto, description: 'Informações completas do paciente e do tutor' })
  patient: BedsidePatientDto;

  @ApiPropertyOptional({
    description: 'Última aferição de sinais vitais registrada para consulta imediata',
    example: {
      temperature: 38.6,
      heartRate: 115,
      respiratoryRate: 22,
      systolicBP: 120,
      capillaryRefillTime: '< 2s',
      bloodGlucose: 95,
      recordedAt: '2026-10-10T16:30:00.000Z',
      measuredBy: 'Dra. Camila Souza',
    },
  })
  latestVitalSigns?: Record<string, any> | null;

  @ApiProperty({
    type: () => [BedsidePendingTaskDto],
    description: 'Medicamentos e procedimentos pendentes imediatos para o plantão',
  })
  pendingTasks: BedsidePendingTaskDto[];
}
