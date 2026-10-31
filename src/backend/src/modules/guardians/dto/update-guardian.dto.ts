import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IUpdateGuardianPayload } from '@nfcarevet/common';
import { GuardianFinancialDto } from './create-guardian.dto';

export class UpdateGuardianDto implements IUpdateGuardianPayload {
  @ApiPropertyOptional({
    description: 'Nome completo do tutor responsável',
    example: 'Lucas Silva de Oliveira',
    maxLength: 100,
  })
  @IsString({ message: 'name deve ser um texto.' })
  @MinLength(3, { message: 'name deve ter no mínimo 3 caracteres.' })
  @MaxLength(100, { message: 'name não pode exceder 100 caracteres.' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato com DDD',
    example: '(15) 99123-3292',
    maxLength: 20,
  })
  @IsString({ message: 'phone deve ser um texto.' })
  @MaxLength(20, { message: 'phone não pode exceder 20 caracteres.' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'CPF do tutor (string vazia ou null para limpar)',
    example: '111.444.777-35',
    maxLength: 20,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsString({ message: 'cpf deve ser um texto.' })
  @MaxLength(20, { message: 'cpf não pode exceder 20 caracteres.' })
  @IsOptional()
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Endereço de e-mail do tutor (string vazia ou null para limpar)',
    example: 'lucas.silva@email.com',
    maxLength: 120,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @MaxLength(120, { message: 'email não pode exceder 120 caracteres.' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Endereço residencial completo (string vazia ou null para limpar)',
    example: 'Rua das Palmeiras, 450 - Apto 82, Pinheiros - São Paulo/SP',
    maxLength: 200,
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsString({ message: 'address deve ser um texto.' })
  @MaxLength(200, { message: 'address não pode exceder 200 caracteres.' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'URL da foto do tutor (string vazia ou null para limpar)',
    example: 'https://cdn.suaclinica.com/guardians/lucas.jpg',
    nullable: true,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  )
  @IsString({ message: 'photoUrl deve ser um texto.' })
  @IsOptional()
  photoUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Indica se o tutor é um cliente ativo da clínica',
    example: true,
  })
  @IsBoolean({ message: 'isActive deve ser um valor booleano.' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Dados financeiros do tutor (ou null para limpar)',
    type: () => GuardianFinancialDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianFinancialDto)
  financial?: GuardianFinancialDto | null;
}
