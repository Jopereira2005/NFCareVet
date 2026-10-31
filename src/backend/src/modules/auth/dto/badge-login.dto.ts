import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class BadgeLoginDto {
  @ApiProperty({
    example: '04A1B2C3D4E5F6',
    description: 'UID do crachá físico NFC do colaborador',
  })
  @IsString()
  @IsNotEmpty({ message: 'O UID do crachá NFC (badgeUid) é obrigatório.' })
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.replace(/[:\s-]/g, '').toUpperCase() : value,
  )
  badgeUid!: string;
}

