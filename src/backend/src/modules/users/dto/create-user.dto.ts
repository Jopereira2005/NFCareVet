import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    example: 'Dr. Lucas Pereira',
    description: 'Nome completo do colaborador',
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome do usuário é obrigatório.' })
  name!: string;

  @ApiProperty({
    example: 'lucas.pereira@nfcarevet.com',
    description: 'Endereço de e-mail institucional',
  })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email!: string;

  @ApiProperty({
    example: 'senhaForte123',
    description: 'Senha inicial de acesso (mínimo de 6 caracteres)',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password!: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.VET,
    description: 'Perfil de permissões (ADMIN: Administrador, VET: Veterinário, REC: Recepção)',
  })
  @IsEnum(UserRole, { message: 'Papel (role) de usuário inválido.' })
  @IsNotEmpty({ message: 'O papel (role) do usuário é obrigatório.' })
  role!: UserRole;

  @ApiPropertyOptional({
    example: '04A1B2C3D4E5F6',
    description: 'UID do crachá físico NFC para login rápido',
  })
  @IsString()
  @IsOptional()
  badgeUid?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Indica se o colaborador está ativo no sistema',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

