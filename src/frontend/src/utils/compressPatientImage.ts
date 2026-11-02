import {
  ALLOWED_PATIENT_PHOTO_MIME_TYPES,
  MAX_PATIENT_PHOTO_BYTES,
  type PatientPhotoMimeType,
} from '@nfcarevet/common';

const MAX_DIMENSION_PX = 800;
const COMPRESSION_QUALITY = 0.8;

export interface CompressedPatientImage {
  blob: Blob;
  mimeType: PatientPhotoMimeType;
  fileSize: number;
  width: number;
  height: number;
}

export function validatePatientPhotoFile(file: File): void {
  if (
    !(ALLOWED_PATIENT_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)
  ) {
    throw new Error(
      'Formato não suportado. Envie apenas imagens JPEG, PNG ou WebP.',
    );
  }

  if (file.size <= 0) {
    throw new Error('O arquivo selecionado está vazio.');
  }

  if (file.size > MAX_PATIENT_PHOTO_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `A imagem selecionada possui ${sizeMb} MB e excede o limite máximo de 3 MB.`,
    );
  }
}

/**
 * Redimensiona a imagem no navegador para no máximo 800x800px (mantendo proporção)
 * e comprime para WebP (ou JPEG como fallback) com 80% de qualidade (~100-150 KB).
 */
export async function compressPatientImage(
  file: File,
): Promise<CompressedPatientImage> {
  validatePatientPhotoFile(file);

  const bitmap = await createImageBitmap(file);

  try {
    let { width, height } = bitmap;

    if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
      if (width >= height) {
        height = Math.round((height * MAX_DIMENSION_PX) / width);
        width = MAX_DIMENSION_PX;
      } else {
        width = Math.round((width * MAX_DIMENSION_PX) / height);
        height = MAX_DIMENSION_PX;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Não foi possível inicializar o processador de imagem.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    const preferredMime: PatientPhotoMimeType = 'image/webp';
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
            return;
          }
          // Fallback para JPEG caso o navegador não suporte encode WebP
          canvas.toBlob(
            (fallbackResult) => {
              if (fallbackResult) resolve(fallbackResult);
              else reject(new Error('Falha ao comprimir a imagem.'));
            },
            'image/jpeg',
            COMPRESSION_QUALITY,
          );
        },
        preferredMime,
        COMPRESSION_QUALITY,
      );
    });

    const finalMimeType: PatientPhotoMimeType = (
      ALLOWED_PATIENT_PHOTO_MIME_TYPES as readonly string[]
    ).includes(blob.type)
      ? (blob.type as PatientPhotoMimeType)
      : 'image/jpeg';

    if (blob.size > MAX_PATIENT_PHOTO_BYTES) {
      throw new Error('A imagem comprimida ainda excede o limite de 3 MB.');
    }

    return {
      blob,
      mimeType: finalMimeType,
      fileSize: blob.size,
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}
