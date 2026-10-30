import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PatientSex } from '@nfcarevet/common';

export class PatientSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Termo de busca livre (nome do pet, raça, nome do tutor ou código da tag NFC)',
    example: 'Thor',
  })
  @IsString({ message: 'query deve ser um texto.' })
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Filtro por espécie (ex.: Canina, Felina)',
    example: 'Canina',
  })
  @IsString({ message: 'species deve ser um texto.' })
  @IsOptional()
  species?: string;

  @ApiPropertyOptional({
    description: 'Filtro por sexo (MALE ou FEMALE)',
    enum: PatientSex,
    example: PatientSex.MALE,
  })
  @IsEnum(PatientSex, { message: 'sex deve ser MALE ou FEMALE.' })
  @IsOptional()
  sex?: PatientSex;

  @ApiPropertyOptional({
    description: 'Filtra pacientes com internação ativa (true) ou sem internação ativa (false)',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'hospitalized deve ser um valor booleano.' })
  @IsOptional()
  hospitalized?: boolean;
}
