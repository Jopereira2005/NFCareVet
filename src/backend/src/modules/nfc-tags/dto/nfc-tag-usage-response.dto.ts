import { ApiProperty } from '@nestjs/swagger';
import { INfcTagUsage } from '@nfcarevet/common';

export class NfcTagUsageResponseDto implements INfcTagUsage {
  @ApiProperty({
    description: 'Total de tags NFC ativas no inventário hospitalar',
    example: 30,
  })
  total!: number;

  @ApiProperty({
    description: 'Total de tags NFC ativas atualmente vinculadas a internações ativas',
    example: 18,
  })
  linked!: number;
}
