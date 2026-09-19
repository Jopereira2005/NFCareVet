import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthUserDto {
  @ApiProperty({ example: 'c8f3e2b1-4712-4cf4-912b-2a76f2d24a91', description: 'ID do usuário' })
  id!: string;

  @ApiProperty({ example: 'Dra. Ana Silva', description: 'Nome do usuário' })
  name!: string;

  @ApiProperty({ example: 'ana.silva@nfcarevet.com', description: 'E-mail cadastrado' })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.VET, description: 'Perfil de acesso do usuário' })
  role!: UserRole;

  @ApiPropertyOptional({ example: '04A1B2C3D4E5F6', nullable: true, description: 'UID do crachá NFC vinculado' })
  badgeUid?: string | null;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token de acesso JWT Bearer',
  })
  accessToken!: string;

  @ApiProperty({ type: () => AuthUserDto, description: 'Dados resumidos do usuário autenticado' })
  user!: AuthUserDto;
}

