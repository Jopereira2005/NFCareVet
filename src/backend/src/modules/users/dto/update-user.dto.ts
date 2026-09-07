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
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password?: string;

  @IsEnum(UserRole, { message: 'Papel (role) de usuário inválido.' })
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  badgeUid?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
