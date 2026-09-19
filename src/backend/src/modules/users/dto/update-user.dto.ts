import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Dr. Lucas Pereira',
    description: 'Nome completo atualizado',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'lucas.pereira@nfcarevet.com',
    description: 'E-mail atualizado',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: 'novaSenha456',
    description: 'Nova senha de acesso (mínimo de 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.VET,
    description: 'Novo perfil de permissões',
  })
  @IsEnum(UserRole, { message: 'Papel (role) de usuário inválido.' })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    example: '04A1B2C3D4E5F6',
    description: 'UID do crachá NFC vinculado',
  })
  @IsString()
  @IsOptional()
  badgeUid?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Status ativo/inativo',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

