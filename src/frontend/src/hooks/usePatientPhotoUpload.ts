import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { Patient } from '@/interfaces/patient.types';
import { patientService } from '@/services/patient.service';
import {
  dashboardQueries,
  guardianQueries,
  patientQueries,
  scheduleQueries,
} from '@/services/query-options';
import { showToast } from '@/stores/useToastStore';
import { compressPatientImage } from '@/utils/compressPatientImage';

export type PhotoUploadStep =
  | 'idle'
  | 'compressing'
  | 'requesting-url'
  | 'uploading-r2'
  | 'saving-record';

export function usePatientPhotoUpload(defaultPatientId = '') {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<PhotoUploadStep>('idle');
  const [progress, setProgress] = useState(0);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidatePatientCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: patientQueries.all() }),
      queryClient.invalidateQueries({ queryKey: guardianQueries.all() }),
      queryClient.invalidateQueries({ queryKey: scheduleQueries.all() }),
      queryClient.invalidateQueries({ queryKey: dashboardQueries.all() }),
    ]);
  };

  /**
   * Fluxo de 3 vias com compressão client-side:
   * 1. Valida (< 3 MB, MIME permitido) e comprime em WebP 800x800 (80% quality) via Canvas.
   * 2. Solicita Presigned URL ao backend (`POST /patients/:id/photo-upload-url`).
   * 3. Faz PUT direto no Cloudflare R2 com acompanhamento de progresso.
   * 4. Confirma persistência no PostgreSQL (`PATCH /patients/:id`), que exclui a foto antiga do R2.
   */
  const uploadPhoto = async (
    file: File,
    overridePatientId?: string,
  ): Promise<Patient | null> => {
    const targetPatientId = overridePatientId ?? defaultPatientId;
    if (!targetPatientId) {
      return null;
    }

    setError(null);
    setProgress(0);

    try {
      // Passo 1: Validação local + Compressão Canvas
      setStep('compressing');
      const compressed = await compressPatientImage(file);

      // Passo 2: Solicita Presigned URL autenticada (sujeita ao Throttle de 5 req/min)
      setStep('requesting-url');
      const { uploadUrl, publicUrl } =
        await patientService.requestPhotoUploadUrl(targetPatientId, {
          mimeType: compressed.mimeType,
          fileSize: compressed.fileSize,
        });

      // Passo 3: Upload direto (PUT) para o bucket Cloudflare R2
      setStep('uploading-r2');
      const mockObjectUrl = await patientService.uploadToPresignedUrl(
        uploadUrl,
        compressed.blob,
        compressed.mimeType,
        (percent) => setProgress(percent),
      );

      // Passo 4: Atualiza o registro no PostgreSQL e aciona limpeza da foto antiga no R2
      setStep('saving-record');
      const finalPhotoUrl =
        typeof mockObjectUrl === 'string' ? mockObjectUrl : publicUrl;

      const updated = await patientService.update(targetPatientId, {
        photoUrl: finalPhotoUrl,
      });

      await invalidatePatientCaches();

      if (!overridePatientId) {
        showToast({
          tone: 'success',
          title: 'Foto atualizada',
          description: `A foto de ${updated.name} foi salva com sucesso.`,
        });
      }

      return updated;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível enviar a foto do paciente.';
      setError(message);
      showToast({
        tone: 'warning',
        title: 'Falha no upload da foto',
        description: message,
      });
      return null;
    } finally {
      setStep('idle');
      setProgress(0);
    }
  };

  const removePhoto = async (): Promise<Patient | null> => {
    if (!defaultPatientId) return null;

    setError(null);
    setIsRemoving(true);

    try {
      const updated = await patientService.update(defaultPatientId, {
        photoUrl: null,
      });

      await invalidatePatientCaches();

      showToast({
        tone: 'success',
        title: 'Foto removida',
        description: `A foto de ${updated.name} foi removida.`,
      });

      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível remover a foto.';
      setError(message);
      showToast({
        tone: 'warning',
        title: 'Erro ao remover foto',
        description: message,
      });
      return null;
    } finally {
      setIsRemoving(false);
    }
  };

  return {
    uploadPhoto,
    removePhoto,
    step,
    progress,
    isUploading: step !== 'idle',
    isRemoving,
    error,
  };
}
