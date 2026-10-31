import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  FinancialStatus,
  ICreateGuardianPayload,
  IGuardianFinancial,
} from '@nfcarevet/common';

export class GuardianFinancialDto implements IGuardianFinancial {
  @ApiProperty({
    description: 'Status financeiro do tutor na clínica',
    enum: FinancialStatus,
    example: FinancialStatus.PAID,
  })
  @IsEnum(FinancialStatus, {
    message: 'status financeiro deve ser PAID, PENDING ou OVERDUE.',
  })
  status!: FinancialStatus;

  @ApiProperty({
    description: 'Método de pagamento preferencial/utilizado',
    example: 'Pix',
    maxLength: 50,
  })
  @IsString({ message: 'paymentMethod deve ser um texto.' })
  @IsNotEmpty({ message: 'paymentMethod é obrigatório.' })
  @MaxLength(50, { message: 'paymentMethod não pode exceder 50 caracteres.' })
  paymentMethod!: string;
}

export class CreateGuardianDto implements ICreateGuardianPayload {
  @ApiProperty({
    description: 'Nome completo do tutor responsável',
    example: 'Lucas Silva de Oliveira',
    maxLength: 100,
  })
  @IsString({ message: 'name deve ser um texto.' })
  @IsNotEmpty({ message: 'name é obrigatório.' })
  @MinLength(3, { message: 'name deve ter no mínimo 3 caracteres.' })
  @MaxLength(100, { message: 'name não pode exceder 100 caracteres.' })
  name: string;

  @ApiProperty({
    description: 'Telefone de contato com DDD',
    example: '(15) 99123-3292',
    maxLength: 20,
  })
  @IsString({ message: 'phone deve ser um texto.' })
  @IsNotEmpty({ message: 'phone é obrigatório.' })
  @MaxLength(20, { message: 'phone não pode exceder 20 caracteres.' })
  phone: string;

  @ApiPropertyOptional({
    description: 'CPF do tutor',
    example: '111.444.777-35',
    maxLength: 20,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString({ message: 'cpf deve ser um texto.' })
  @MaxLength(20, { message: 'cpf não pode exceder 20 caracteres.' })
  @IsOptional()
  cpf?: string;

  @ApiPropertyOptional({
    description: 'Endereço de e-mail do tutor',
    example: 'lucas.silva@email.com',
    maxLength: 120,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  @MaxLength(120, { message: 'email não pode exceder 120 caracteres.' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Endereço residencial completo',
    example: 'Rua das Palmeiras, 450 - Apto 82, Pinheiros - São Paulo/SP',
    maxLength: 200,
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString({ message: 'address deve ser um texto.' })
  @MaxLength(200, { message: 'address não pode exceder 200 caracteres.' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'URL da foto do tutor',
    example: 'https://cdn.suaclinica.com/guardians/lucas.jpg',
  })
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString({ message: 'photoUrl deve ser um texto.' })
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Indica se o tutor é um cliente ativo da clínica',
    default: true,
    example: true,
  })
  @IsBoolean({ message: 'isActive deve ser um valor booleano.' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Dados financeiros do tutor (status e método de pagamento)',
    type: () => GuardianFinancialDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianFinancialDto)
  financial?: GuardianFinancialDto | null;
}
