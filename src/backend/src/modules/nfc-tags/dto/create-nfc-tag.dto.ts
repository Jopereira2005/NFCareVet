import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNfcTagDto {
  @ApiProperty({
    example: '04A1B2C3D4E5F6',
    description: 'UID físico da tag NFC (entre 8 e 28 caracteres hexadecimais, ex: NTAG213/215)',
  })
  @IsString()
  @IsNotEmpty({ message: 'O UID da tag é obrigatório.' })
  @Transform(({ value }: { value: string }) =>
    value ? value.replace(/[:\s-]/g, '').toUpperCase() : value,
  )
  @Matches(/^[0-9A-F]{8,28}$/, {
    message: 'UID inválido. Deve conter entre 8 e 28 caracteres hexadecimais.',
  })
  tagUid: string;
}

