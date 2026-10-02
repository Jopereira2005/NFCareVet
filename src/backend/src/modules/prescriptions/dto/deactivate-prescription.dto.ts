import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivatePrescriptionDto {
  @ApiPropertyOptional({
    description: 'Motivo clínico ou administrativo da inativação do protocolo',
    example: 'Substituição por novo protocolo terapêutico após estabilização hemodinâmica.',
    maxLength: 500,
  })
  @IsString({ message: 'reason deve ser um texto.' })
  @IsOptional()
  @MaxLength(500, { message: 'reason não pode exceder 500 caracteres.' })
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Se verdadeiro, cancela automaticamente todos os itens desta prescrição que ainda estejam pendentes (status PENDING)',
    default: true,
    example: true,
  })
  @IsBoolean({ message: 'cancelPendingItems deve ser um booleano.' })
  @IsOptional()
  cancelPendingItems?: boolean = true;
}
