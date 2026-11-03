import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

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

  @ApiPropertyOptional({
    example: '1234',
    description: 'PIN de segurança numérico de 4 dígitos (obrigatório se o colaborador possuir PIN configurado)',
  })
  @IsOptional()
  @IsString()
  @Length(4, 4, { message: 'O PIN deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O PIN deve ser composto apenas por números.' })
  pin?: string;
}

