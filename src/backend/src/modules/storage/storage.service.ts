import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import {
  ALLOWED_PATIENT_PHOTO_MIME_TYPES,
  IPatientPhotoUploadUrlResponse,
  MAX_PATIENT_PHOTO_BYTES,
  PatientPhotoMimeType,
} from '@nfcarevet/common';

const MIME_TO_EXTENSION: Record<PatientPhotoMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const PRESIGNED_URL_EXPIRES_IN_SECONDS = 120;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null;
  private readonly bucketName: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID', '');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID', '');
    const secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
      '',
    );
    const customEndpoint = this.configService.get<string>('R2_ENDPOINT', '');

    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME', '');
    const rawPublicUrl =
      this.configService.get<string>('R2_PUBLIC_URL') ||
      this.configService.get<string>('R2_PUBLIC_BASE_URL') ||
      '';
    this.publicBaseUrl = rawPublicUrl.replace(/\/+$/, '');

    const endpoint =
      customEndpoint ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      this.s3Client = null;
      this.logger.warn(
        'Credenciais do Cloudflare R2 não configuradas (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY). O upload direto via S3 ficará indisponível até o preenchimento das variáveis de ambiente.',
      );
    }
  }

  async generatePresignedUploadUrl(
    patientId: string,
    mimeType: string,
    fileSize: number,
  ): Promise<IPatientPhotoUploadUrlResponse> {
    if (!this.isAllowedMimeType(mimeType)) {
      throw new BadRequestException(
        `Formato de imagem não suportado (${mimeType}). Utilize apenas JPEG, PNG ou WebP.`,
      );
    }

    if (
      !Number.isInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_PATIENT_PHOTO_BYTES
    ) {
      throw new BadRequestException(
        `O tamanho da imagem deve ser entre 1 byte e ${MAX_PATIENT_PHOTO_BYTES / (1024 * 1024)} MB.`,
      );
    }

    const sanitizedPatientId = patientId.replace(/[^a-zA-Z0-9-]/g, '');
    if (!sanitizedPatientId) {
      throw new BadRequestException('Identificador de paciente inválido.');
    }

    if (!this.s3Client) {
      throw new InternalServerErrorException(
        'Serviço de armazenamento (Cloudflare R2) não está configurado no servidor.',
      );
    }

    const extension = MIME_TO_EXTENSION[mimeType];
    const key = `patients/${sanitizedPatientId}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
      signableHeaders: new Set(['content-type', 'content-length']),
    });

    const publicUrl = this.publicBaseUrl
      ? `${this.publicBaseUrl}/${key}`
      : uploadUrl.split('?')[0];

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresIn: PRESIGNED_URL_EXPIRES_IN_SECONDS,
    };
  }

  async deleteFile(fileUrlOrKey: string | null | undefined): Promise<void> {
    if (!fileUrlOrKey || !this.s3Client) {
      return;
    }

    const key = this.extractObjectKey(fileUrlOrKey);
    if (!key) {
      return;
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(` Objeto antigo removido do R2 com sucesso: ${key}`);
    } catch (error) {
      this.logger.error(
        `Falha ao remover objeto antigo "${key}" do Cloudflare R2: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  extractObjectKey(fileUrlOrKey: string): string | null {
    const trimmed = fileUrlOrKey.trim();
    if (!trimmed) return null;

    // Caso já seja a própria key relativa
    if (/^patients\/[a-zA-Z0-9-]+\/[a-fA-F0-9-]+\.(jpg|png|webp)$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      const pathWithoutLeadingSlash = parsed.pathname.replace(/^\/+/, '');

      const bucketPrefix = `${this.bucketName}/`;
      const normalizedKey = pathWithoutLeadingSlash.startsWith(bucketPrefix)
        ? pathWithoutLeadingSlash.slice(bucketPrefix.length)
        : pathWithoutLeadingSlash;

      if (
        /^patients\/[a-zA-Z0-9-]+\/[a-fA-F0-9-]+\.(jpg|png|webp)$/.test(
          normalizedKey,
        )
      ) {
        return normalizedKey;
      }
    } catch {
      return null;
    }

    return null;
  }

  private isAllowedMimeType(mimeType: string): mimeType is PatientPhotoMimeType {
    return (ALLOWED_PATIENT_PHOTO_MIME_TYPES as readonly string[]).includes(
      mimeType,
    );
  }
}
