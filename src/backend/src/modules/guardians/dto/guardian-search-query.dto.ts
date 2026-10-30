import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GuardianSearchQueryDto {
  @ApiPropertyOptional({
    description: 'Termo de busca livre (nome do tutor, CPF ou nome de um pet vinculado)',
    example: 'Lucas Silva',
  })
  @IsString({ message: 'query deve ser um texto.' })
  @IsOptional()
  query?: string;
}
