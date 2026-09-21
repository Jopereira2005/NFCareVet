import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ICreateHospitalizationPayload } from '@nfcarevet/common';

export class CreateHospitalizationDto implements ICreateHospitalizationPayload {
  @ApiProperty({
    description: 'UUID do paciente a ser internado',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'patientId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'patientId é obrigatório.' })
  patientId: string;

  @ApiProperty({
    description: 'UUID da baia/canil onde o paciente será alojado',
    example: '4ba85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsUUID('4', { message: 'kennelId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'kennelId é obrigatório.' })
  kennelId: string;

  @ApiProperty({
    description: 'Motivo principal da admissão hospitalar',
    example: 'Gastroenterite aguda com desidratação moderada',
  })
  @IsString({ message: 'admissionReason deve ser um texto.' })
  @IsNotEmpty({ message: 'admissionReason é obrigatório.' })
  @MaxLength(255, { message: 'admissionReason não pode exceder 255 caracteres.' })
  admissionReason: string;

  @ApiProperty({
    description: 'Diagnóstico preliminar ou suspeita clínica inicial',
    example: 'Suspeita de corpo estranho linear ou gastroenterite hemorrágica',
  })
  @IsString({ message: 'preliminaryDiagnosis deve ser um texto.' })
  @IsNotEmpty({ message: 'preliminaryDiagnosis é obrigatório.' })
  @MaxLength(500, { message: 'preliminaryDiagnosis não pode exceder 500 caracteres.' })
  preliminaryDiagnosis: string;

  @ApiPropertyOptional({
    description: 'UUID do veterinário responsável. Se omitido, utiliza o usuário autenticado.',
    example: '5ca85f64-5717-4562-b3fc-2c963f66afa8',
  })
  @IsUUID('4', { message: 'responsibleVetId deve ser um UUID válido.' })
  @IsOptional()
  responsibleVetId?: string;

  @ApiPropertyOptional({
    description: 'Identificador da tag NFC física (UID de hardware, publicCode ou UUID da tag). Opcional.',
    example: '04A23B89C16080',
  })
  @IsString({ message: 'tagIdentifier deve ser uma string.' })
  @IsOptional()
  tagIdentifier?: string;
}
