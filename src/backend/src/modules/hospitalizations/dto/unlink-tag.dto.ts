import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnlinkTagDto {
  @ApiPropertyOptional({
    example: 'Higienização e liberação para reuso',
    description: 'Motivo opcional da desvinculação da tag NFC do leito/paciente para registro clínico.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
