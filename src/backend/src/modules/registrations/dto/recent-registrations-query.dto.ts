import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecentRegistrationsQueryDto {
  @ApiPropertyOptional({
    description: 'Quantidade máxima de cadastros recentes a retornar',
    example: 3,
    default: 3,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O parâmetro limit deve ser um número inteiro.' })
  @Min(1, { message: 'O parâmetro limit deve ser no mínimo 1.' })
  @Max(50, { message: 'O parâmetro limit deve ser no máximo 50.' })
  limit?: number = 3;
}
