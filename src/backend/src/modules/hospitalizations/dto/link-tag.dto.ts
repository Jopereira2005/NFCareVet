import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class LinkTagDto {
  @ApiProperty({
    example: '04:A2:3B:89:C1:60:80',
    description:
      'Identificador da tag NFC física. Aceita hardware UID (ex: 04:A2:3B:89 ou 04A23B89C16080), publicCode (ex: tag-thor-01) ou UUID da tag no banco.',
  })
  @IsString()
  @IsNotEmpty({ message: 'O identificador da tag NFC é obrigatório.' })
  @Transform(({ value }: { value: string }) => (typeof value === 'string' ? value.trim() : value))
  tagIdentifier: string;
}
