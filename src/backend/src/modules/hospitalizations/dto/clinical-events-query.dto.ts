import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ClinicalEventsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filtro pelo profissional executor do evento. Use "me" para listar os eventos registrados pelo usuário logado (@CurrentUser) ou informe o UUID de um usuário.',
    example: 'me',
  })
  @IsOptional()
  @IsString()
  executor?: string;

  @ApiPropertyOptional({
    description: 'Limite máximo de eventos recentes a retornar',
    example: 50,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
