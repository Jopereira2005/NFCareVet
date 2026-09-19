import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BedsidePatientDto } from './bedside-patient-response.dto';

export class BedsideKennelDto {
  @ApiProperty({ example: 'k1-4712-4cf4-912b-2a76f2d24a91', description: 'ID do canil/leito' })
  id: string;

  @ApiProperty({ example: 'Canil 01 - UTI', description: 'Identificação ou nome do leito' })
  name: string;

  @ApiPropertyOptional({ example: 'Equipado com ponto de oxigênio', nullable: true, description: 'Observações do leito' })
  notes?: string | null;
}

export class QuickRecordResponseDto {
  @ApiProperty({ example: 'hosp-1234-5678-90ab-cdef12345678', description: 'ID da internação ativa' })
  hospitalizationId: string;

  @ApiProperty({ type: () => BedsideKennelDto, description: 'Informações do leito/canil' })
  kennel: BedsideKennelDto;

  @ApiProperty({ type: () => BedsidePatientDto, description: 'Informações do paciente e tutor' })
  patient: BedsidePatientDto;

  @ApiProperty({
    type: [Object],
    description: 'Lista de prescrições ativas com seus respectivos itens e horários programados',
  })
  prescriptions: any[];

  @ApiProperty({
    type: [Object],
    description: 'Histórico recente de eventos clínicos e medicações aplicadas',
  })
  clinicalEvents: any[];
}

