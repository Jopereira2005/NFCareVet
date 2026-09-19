import { ApiProperty } from '@nestjs/swagger';

export class NfcTagResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', description: 'ID interno da tag' })
  id: string;

  @ApiProperty({ example: '04A1B2C3D4E5F6', description: 'UID hexadecimal da tag física' })
  tagUid: string;

  @ApiProperty({ example: 'K-01-A9F3', description: 'Código público/slug gravado na URL da tag' })
  publicCode: string;

  @ApiProperty({ example: true, description: 'Status de ativação da tag' })
  active: boolean;

  @ApiProperty({
    example: 'http://localhost:3000/bedside/K-01-A9F3',
    description: 'URL completa apontada pelo NDEF da tag',
  })
  targetUrl: string;

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z', description: 'Data de cadastro' })
  createdAt: Date;
}

