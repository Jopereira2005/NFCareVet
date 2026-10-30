import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IKennel, IKennelOccupant } from '@nfcarevet/common';

export class KennelOccupantDto implements IKennelOccupant {
  @ApiProperty({
    description: 'UUID do paciente atualmente internado na baia',
    example: 'uuid-patient-1',
  })
  patientId!: string;

  @ApiProperty({
    description: 'Nome do paciente atualmente internado na baia',
    example: 'Thor',
  })
  patientName!: string;
}

export class KennelResponseDto implements IKennel {
  @ApiProperty({
    description: 'Identificador único (UUID) da baia/leito',
    example: 'uuid-kennel-1',
  })
  id!: string;

  @ApiProperty({
    description: 'Nome / identificação da baia',
    example: 'Baia 01 - UTI Canina',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Observações sobre a baia',
    example: 'Monitoramento intensivo',
    nullable: true,
  })
  notes?: string | null;

  @ApiProperty({
    description: 'Indica se a baia está ativa para uso',
    example: true,
  })
  isActive!: boolean;

  @ApiProperty({
    description: 'Data de criação do registro da baia',
    example: '2025-01-10T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Paciente atualmente ocupando a baia (ou null se livre)',
    type: KennelOccupantDto,
    nullable: true,
  })
  occupant?: KennelOccupantDto | null;
}
