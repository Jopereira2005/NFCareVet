import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 'd3b07384-d113-460f-93d3-7d72c1c68e1a', description: 'ID do usuário' })
  id!: string;

  @ApiProperty({ example: 'Dra. Maria Clara', description: 'Nome completo' })
  name!: string;

  @ApiProperty({ example: 'maria.clara@nfcarevet.com', description: 'E-mail cadastrado' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VET, description: 'Perfil de acesso' })
  role!: UserRole;

  @ApiPropertyOptional({ example: '04A1B2C3D4E5F6', nullable: true, description: 'UID do crachá NFC vinculado' })
  badgeUid?: string | null;

  @ApiProperty({ example: true, description: 'Indica se o colaborador está ativo' })
  active!: boolean;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z', description: 'Data de criação do registro' })
  createdAt!: Date;
}

