import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientResponseDto } from '../../patients/dto/patient-response.dto';

export class GuardianResponseDto {
  @ApiProperty({ example: 'uuid-guardian-1' })
  id: string;

  @ApiProperty({ example: 'Lucas Silva de Oliveira' })
  name: string;

  @ApiPropertyOptional({ example: '111.444.777-35', nullable: true })
  cpf?: string | null;

  @ApiPropertyOptional({ example: 'lucas.silva@email.com', nullable: true })
  email?: string | null;

  @ApiProperty({ example: '(15) 99123-3292' })
  phone: string;

  @ApiPropertyOptional({
    example: 'Rua das Palmeiras, 450 - Apto 82, Pinheiros - São Paulo/SP',
    nullable: true,
  })
  address?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-18T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: () => [PatientResponseDto] })
  patients: PatientResponseDto[];
}
