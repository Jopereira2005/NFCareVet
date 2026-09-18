import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateNfcTagDto {
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
