import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CancelPrescriptionItemDto {
  @ApiProperty({
    description: 'Justificativa médica ou técnica obrigatória para o cancelamento/suspensão do item',
    example: 'Paciente apresentou êmese intensa e hipersensibilidade prévia; medicação suspensa pelo veterinário de plantão.',
    minLength: 10,
    maxLength: 500,
  })
  @IsString({ message: 'justification deve ser um texto.' })
  @IsNotEmpty({ message: 'justification é obrigatória para suspender um medicamento ou procedimento.' })
  @MinLength(10, { message: 'A justificativa deve conter pelo menos 10 caracteres.' })
  @MaxLength(500, { message: 'A justificativa não pode exceder 500 caracteres.' })
  justification: string;

  @ApiPropertyOptional({
    description: 'Orientações complementares para a equipe de enfermagem à beira de leito',
    example: 'Aguardar resultado de hemograma antes de substituir a classe medicamentosa.',
    maxLength: 500,
  })
  @IsString({ message: 'notes deve ser um texto.' })
  @IsOptional()
  @MaxLength(500, { message: 'notes não pode exceder 500 caracteres.' })
  notes?: string;
}
