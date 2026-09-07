import { IsNotEmpty, IsString } from 'class-validator';

export class BadgeLoginDto {
  @IsString()
  @IsNotEmpty({ message: 'O UID do crachá NFC (badgeUid) é obrigatório.' })
  badgeUid!: string;
}
