import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ICreatePatientPayload, PatientSex } from '@nfcarevet/common';

export class CreatePatientDto implements ICreatePatientPayload {
  @ApiProperty({
    description: 'UUID do tutor responsável pelo paciente',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'guardianId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'guardianId é obrigatório.' })
  guardianId: string;

  @ApiProperty({
    description: 'Nome do paciente (pet)',
    example: 'Thor',
    maxLength: 80,
  })
  @IsString({ message: 'name deve ser um texto.' })
  @IsNotEmpty({ message: 'name é obrigatório.' })
  @MaxLength(80, { message: 'name não pode exceder 80 caracteres.' })
  name: string;

  @ApiProperty({
    description: 'Espécie do animal (ex.: Canina, Felina)',
    example: 'Canina',
    maxLength: 50,
  })
  @IsString({ message: 'species deve ser um texto.' })
  @IsNotEmpty({ message: 'species é obrigatório.' })
  @MaxLength(50, { message: 'species não pode exceder 50 caracteres.' })
  species: string;

  @ApiPropertyOptional({
    description: 'Sexo do animal (MALE ou FEMALE)',
    enum: PatientSex,
    example: PatientSex.MALE,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(PatientSex, { message: 'sex deve ser MALE ou FEMALE.' })
  @IsOptional()
  sex?: PatientSex;

  @ApiPropertyOptional({
    description: 'Raça do animal',
    example: 'Golden Retriever',
    maxLength: 50,
  })
  @IsString({ message: 'breed deve ser um texto.' })
  @IsOptional()
  @MaxLength(50, { message: 'breed não pode exceder 50 caracteres.' })
  breed?: string;

  @ApiPropertyOptional({
    description: 'Data de nascimento do animal (formato ISO 8601)',
    example: '2022-04-10',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsDateString({}, { message: 'birthDate deve ser uma data ISO 8601 válida.' })
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Tipo sanguíneo do animal',
    example: 'DEA 1.1+',
    maxLength: 20,
  })
  @IsString({ message: 'bloodType deve ser um texto.' })
  @IsOptional()
  @MaxLength(20, { message: 'bloodType não pode exceder 20 caracteres.' })
  bloodType?: string;

  @ApiPropertyOptional({
    description: 'Peso corporal em quilogramas (kg)',
    example: 28.4,
    minimum: 0.01,
    maximum: 999.99,
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @Type(() => Number)
  @IsNumber({}, { message: 'weightKg deve ser um valor numérico.' })
  @Min(0.01, { message: 'weightKg deve ser maior que zero.' })
  @Max(999.99, { message: 'weightKg não pode exceder 999.99 kg.' })
  @IsOptional()
  weightKg?: number;

  @ApiPropertyOptional({
    description: 'URL da foto do paciente',
    example: 'https://cdn.suaclinica.com/pets/thor.jpg',
  })
  @IsString({ message: 'photoUrl deve ser um texto.' })
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Alergias conhecidas (separadas por vírgula)',
    example: 'Dipirona, Penicilina',
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
    default: false,
    example: false,
  })
  @IsBoolean({ message: 'isFasting deve ser um valor booleano.' })
  @IsOptional()
  isFasting?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se o paciente é castrado',
    default: false,
    example: true,
  })
  @IsBoolean({ message: 'isCastrated deve ser um valor booleano.' })
  @IsOptional()
  isCastrated?: boolean;

  @ApiPropertyOptional({
    description: 'Observações de comportamento e manejo clínico',
    example: 'Dócil, porém assustado com manipulação de patas traseiras',
  })
  @IsString({ message: 'behaviorNotes deve ser um texto.' })
  @IsOptional()
  behaviorNotes?: string;
}
