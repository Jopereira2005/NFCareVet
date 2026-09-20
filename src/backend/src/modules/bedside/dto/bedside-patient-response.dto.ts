import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BedsideGuardianDto {
  @ApiProperty({ example: 'g1a2b3c4-912b-4712-8e3d-2a76f2d24a91', description: 'ID do tutor' })
  id: string;

  @ApiProperty({ example: 'Carlos Alberto Santos', description: 'Nome do tutor responsável' })
  name: string;

  @ApiProperty({ example: '(15) 99123-4567', description: 'Telefone de contato para urgências' })
  phone: string;

  @ApiPropertyOptional({ example: 'carlos.santos@email.com', nullable: true, description: 'E-mail do tutor' })
  email?: string | null;

  @ApiPropertyOptional({ example: '123.456.789-00', nullable: true, description: 'CPF do tutor' })
  cpf?: string | null;
}

export class BedsidePatientDto {
  @ApiProperty({ example: 'p1a2b3c4-4712-4cf4-912b-2a76f2d24a91', description: 'ID do paciente' })
  id: string;

  @ApiProperty({ example: 'Thor', description: 'Nome do animal' })
  name: string;

  @ApiProperty({ example: 'Canino', description: 'Espécie' })
  species: string;

  @ApiPropertyOptional({ example: 'Golden Retriever', nullable: true, description: 'Raça' })
  breed?: string | null;

  @ApiPropertyOptional({ example: 32.5, nullable: true, description: 'Peso aferido em kg' })
  weightKg?: number | any | null;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1552053831-71594a27632d',
    nullable: true,
    description: 'Foto do paciente',
  })
  photoUrl?: string | null;

  @ApiPropertyOptional({ example: 'Alergia a Dipirona', nullable: true, description: 'Alergias conhecidas' })
  allergies?: string | null;

  @ApiProperty({ example: false, description: 'Indica se o paciente deve permanecer em jejum' })
  isFasting: boolean;

  @ApiProperty({ example: true, description: 'Indica se o paciente é castrado' })
  isCastrated: boolean;

  @ApiPropertyOptional({
    example: 'Muito dócil, aceita medicação em sachê.',
    nullable: true,
    description: 'Observações de comportamento e temperamento',
  })
  behaviorNotes?: string | null;

  @ApiProperty({ type: () => BedsideGuardianDto, description: 'Dados do tutor responsável' })
  guardian: BedsideGuardianDto;
}

