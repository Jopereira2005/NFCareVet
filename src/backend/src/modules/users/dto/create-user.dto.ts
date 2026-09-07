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
  @IsString()
  @IsNotEmpty({ message: 'O nome do usuário é obrigatório.' })
  name!: string;

  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password!: string;

  @IsEnum(UserRole, { message: 'Papel (role) de usuário inválido.' })
  @IsNotEmpty({ message: 'O papel (role) do usuário é obrigatório.' })
  role!: UserRole;

  @IsString()
  @IsOptional()
  badgeUid?: string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
