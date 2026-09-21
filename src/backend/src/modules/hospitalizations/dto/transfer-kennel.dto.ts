import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ITransferKennelPayload } from '@nfcarevet/common';

export class TransferKennelDto implements ITransferKennelPayload {
  @ApiProperty({
    description: 'UUID da nova baia/canil de destino',
    example: '4ba85f64-5717-4562-b3fc-2c963f66afa7',
  })
  @IsUUID('4', { message: 'targetKennelId deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'targetKennelId é obrigatório.' })
  targetKennelId: string;

  @ApiPropertyOptional({
    description: 'Motivo da transferência interna de leito',
    example: 'Transferência para baia de isolamento ou canil de maior porte',
  })
  @IsString({ message: 'reason deve ser um texto.' })
  @IsOptional()
  @MaxLength(255, { message: 'reason não pode exceder 255 caracteres.' })
  reason?: string;
}
