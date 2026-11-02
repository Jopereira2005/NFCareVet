import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ALLOWED_PATIENT_PHOTO_MIME_TYPES,
  MAX_PATIENT_PHOTO_BYTES,
  type IPatientPhotoUploadUrlRequest,
  type IPatientPhotoUploadUrlResponse,
  type PatientPhotoMimeType,
} from '@nfcarevet/common';

export class GeneratePhotoUploadUrlDto implements IPatientPhotoUploadUrlRequest {
  @ApiProperty({
    description:
      'MIME Type estrito do arquivo de imagem (apenas JPEG, PNG ou WebP)',
    enum: ALLOWED_PATIENT_PHOTO_MIME_TYPES,
    example: 'image/webp',
  })
  @IsIn(ALLOWED_PATIENT_PHOTO_MIME_TYPES, {
    message:
      'Formato de arquivo não permitido. Envie apenas image/jpeg, image/png ou image/webp.',
  })
  mimeType!: PatientPhotoMimeType;

  @ApiProperty({
    description: 'Tamanho exato do arquivo em bytes (máximo de 3 MB = 3145728 bytes)',
    example: 154320,
    minimum: 1,
    maximum: MAX_PATIENT_PHOTO_BYTES,
  })
  @Type(() => Number)
  @IsInt({ message: 'fileSize deve ser um número inteiro em bytes.' })
  @Min(1, { message: 'O arquivo não pode estar vazio (mínimo 1 byte).' })
  @Max(MAX_PATIENT_PHOTO_BYTES, {
    message: `O arquivo excede o tamanho máximo permitido de 3 MB (${MAX_PATIENT_PHOTO_BYTES} bytes).`,
  })
  fileSize!: number;
}

export class PhotoUploadUrlResponseDto
  implements IPatientPhotoUploadUrlResponse
{
  @ApiProperty({
    description:
      'URL pré-assinada (PUT) do Cloudflare R2 com assinatura de Content-Type e Content-Length',
    example:
      'https://account.r2.cloudflarestorage.com/nfcarevet-media/patients/3fa85f64/8b91e2.webp?X-Amz-Algorithm=...',
  })
  uploadUrl!: string;

  @ApiProperty({
    description:
      'URL pública final da imagem para ser enviada no PATCH /patients/:id após conclusão do PUT',
    example:
      'https://cdn.nfcarevet.com.br/patients/3fa85f64-5717-4562-b3fc-2c963f66afa6/8b91e2.webp',
  })
  publicUrl!: string;

  @ApiProperty({
    description: 'Chave gerada e sanitizada do objeto no bucket R2',
    example: 'patients/3fa85f64-5717-4562-b3fc-2c963f66afa6/8b91e2.webp',
  })
  key!: string;

  @ApiProperty({
    description: 'Tempo de expiração da URL pré-assinada em segundos',
    example: 120,
  })
  expiresIn!: number;
}
