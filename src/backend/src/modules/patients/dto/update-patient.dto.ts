import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IUpdatePatientPayload, PatientSex } from '@nfcarevet/common';

export class UpdatePatientDto implements IUpdatePatientPayload {
  @ApiPropertyOptional({
    description: 'UUID do tutor responsável pelo paciente',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'guardianId deve ser um UUID válido.' })
  @IsOptional()
  guardianId?: string;

  @ApiPropertyOptional({
    description: 'Nome do paciente (pet)',
    example: 'Thor',
    maxLength: 80,
  })
  @IsString({ message: 'name deve ser um texto.' })
  @MaxLength(80, { message: 'name não pode exceder 80 caracteres.' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Espécie do animal (ex.: Canina, Felina)',
    example: 'Canina',
    maxLength: 50,
  })
  @IsString({ message: 'species deve ser um texto.' })
  @MaxLength(50, { message: 'species não pode exceder 50 caracteres.' })
  @IsOptional()
  species?: string;

  @ApiPropertyOptional({
    description: 'Sexo do animal (MALE, FEMALE ou null para limpar)',
    enum: PatientSex,
    nullable: true,
    example: PatientSex.MALE,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsEnum(PatientSex, { message: 'sex deve ser MALE ou FEMALE.' })
  @IsOptional()
  sex?: PatientSex | null;

  @ApiPropertyOptional({
    description: 'Raça do animal',
    example: 'Golden Retriever',
    maxLength: 50,
    nullable: true,
  })
  @IsString({ message: 'breed deve ser um texto.' })
  @MaxLength(50, { message: 'breed não pode exceder 50 caracteres.' })
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({
    description: 'Data de nascimento do animal (formato ISO 8601 ou null para limpar)',
    example: '2022-04-10',
    nullable: true,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsDateString({}, { message: 'birthDate deve ser uma data ISO 8601 válida.' })
  @IsOptional()
  birthDate?: string | null;

  @ApiPropertyOptional({
    description: 'Tipo sanguíneo do animal (ou null para limpar)',
    example: 'DEA 1.1+',
    maxLength: 20,
    nullable: true,
  })
  @Transform(({ value }) => (value === '' ? null : value))
  @IsString({ message: 'bloodType deve ser um texto.' })
  @MaxLength(20, { message: 'bloodType não pode exceder 20 caracteres.' })
  @IsOptional()
  bloodType?: string | null;

  @ApiPropertyOptional({
    description: 'Peso corporal em quilogramas (kg)',
    example: 28.4,
    minimum: 0.01,
    maximum: 999.99,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Number)
  @IsNumber({}, { message: 'weightKg deve ser um valor numérico.' })
  @Min(0.01, { message: 'weightKg deve ser maior que zero.' })
  @Max(999.99, { message: 'weightKg não pode exceder 999.99 kg.' })
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({
    description: 'URL da foto do paciente',
    example: 'https://cdn.suaclinica.com/pets/thor.jpg',
    nullable: true,
  })
  @IsString({ message: 'photoUrl deve ser um texto.' })
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Alergias conhecidas',
    example: 'Dipirona, Penicilina',
    nullable: true,
  })
  @IsString({ message: 'allergies deve ser um texto.' })
  @IsOptional()
  allergies?: string;

  @ApiPropertyOptional({
    description: 'Tratamentos contínuos ou em andamento do paciente',
    example: ['Dermatite atópica'],
    type: [String],
  })
  @IsArray({ message: 'treatments deve ser uma lista de textos.' })
  @IsString({ each: true, message: 'Cada tratamento deve ser um texto.' })
  @IsOptional()
  treatments?: string[];

  @ApiPropertyOptional({
    description: 'Indica se o paciente está em jejum alimentar/hídrico',
    example: false,
  })
  @IsBoolean({ message: 'isFasting deve ser um valor booleano.' })
  @IsOptional()
  isFasting?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se o paciente é castrado',
    example: true,
  })
  @IsBoolean({ message: 'isCastrated deve ser um valor booleano.' })
  @IsOptional()
  isCastrated?: boolean;

  @ApiPropertyOptional({
    description: 'Observações de comportamento e manejo clínico',
    example: 'Dócil, porém assustado com manipulação de patas traseiras',
    nullable: true,
  })
  @IsString({ message: 'behaviorNotes deve ser um texto.' })
  @IsOptional()
  behaviorNotes?: string;
}
