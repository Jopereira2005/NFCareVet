import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { ALLOWED_PATIENT_PHOTO_MIME_TYPES } from '@nfcarevet/common';

import { PawIcon } from '@/assets/icons/paw-icon';
import { Avatar, Button } from '@/components/ui';
import {
  usePatientPhotoUpload,
  type PhotoUploadStep,
} from '@/hooks/usePatientPhotoUpload';
import type { Patient } from '@/interfaces/patient.types';
import { validatePatientPhotoFile } from '@/utils/compressPatientImage';

import styles from './patient-photo-uploader.module.scss';

const STEP_LABELS: Record<PhotoUploadStep, string> = {
  idle: '',
  compressing: 'Otimizando e redimensionando imagem (WebP 800px)…',
  'requesting-url': 'Solicitando autorização segura ao servidor…',
  'uploading-r2': 'Enviando para o Cloudflare R2…',
  'saving-record': 'Atualizando prontuário e limpando versão anterior…',
};

type ExistingPatientProps = {
  mode?: 'immediate';
  patient: Patient;
};

type StagedPatientProps = {
  mode: 'staged';
  stagedFile: File | null;
  onStagedFileChange: (file: File | null) => void;
  step?: PhotoUploadStep;
  progress?: number;
  disabled?: boolean;
};

type PatientPhotoUploaderProps = ExistingPatientProps | StagedPatientProps;

export function PatientPhotoUploader(props: PatientPhotoUploaderProps) {
  if (props.mode === 'staged') {
    return <StagedPhotoUploader {...props} />;
  }

  return <ImmediatePhotoUploader patient={props.patient} />;
}

function ImmediatePhotoUploader({ patient }: { patient: Patient }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    uploadPhoto,
    removePhoto,
    step,
    progress,
    isUploading,
    isRemoving,
    error,
  } = usePatientPhotoUpload(patient.id);

  const isBusy = isUploading || isRemoving;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    await uploadPhoto(file);
  };

  return (
    <div className={styles['photo-uploader']}>
      <div className={styles['photo-uploader__row']}>
        <div className={styles['photo-uploader__preview']}>
          <Avatar
            src={patient.photoUrl ?? undefined}
            alt={`Foto de ${patient.name}`}
            size={68}
            shape="rounded"
            fallback={<PawIcon aria-hidden="true" />}
          />
        </div>

        <div className={styles['photo-uploader__info']}>
          <p className={styles['photo-uploader__title']}>Foto do paciente</p>
          <p className={styles['photo-uploader__hint']}>
            JPEG, PNG ou WebP até 3 MB. A imagem é comprimida automaticamente
            antes do envio.
          </p>

          <div className={styles['photo-uploader__actions']}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_PATIENT_PHOTO_MIME_TYPES.join(',')}
              className={styles['photo-uploader__input']}
              onChange={handleFileChange}
              disabled={isBusy}
            />
            <Button
              type="button"
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <Camera aria-hidden="true" />
              <span>{patient.photoUrl ? 'Trocar foto' : 'Enviar foto'}</span>
            </Button>

            {patient.photoUrl && (
              <Button
                type="button"
                variant="danger"
                onClick={() => void removePhoto()}
                disabled={isBusy}
              >
                <Trash2 aria-hidden="true" />
                <span>{isRemoving ? 'Removendo…' : 'Remover'}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {isUploading && (
        <>
          <div
            className={styles['photo-uploader__progress-bar']}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles['photo-uploader__progress-fill']}
              style={{
                width: `${step === 'uploading-r2' ? Math.max(progress, 15) : 100}%`,
              }}
            />
          </div>
          <p className={styles['photo-uploader__status']}>
            {STEP_LABELS[step]}
            {step === 'uploading-r2' && progress > 0 ? ` (${progress}%)` : ''}
          </p>
        </>
      )}

      {error && (
        <p className={styles['photo-uploader__error']} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function StagedPhotoUploader({
  stagedFile,
  onStagedFileChange,
  step = 'idle',
  progress = 0,
  disabled = false,
}: StagedPatientProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isUploading = step !== 'idle';
  const isBusy = disabled || isUploading;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      validatePatientPhotoFile(file);
      setLocalError(null);
      setPreviewUrl(URL.createObjectURL(file));
      onStagedFileChange(file);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Arquivo de imagem inválido.',
      );
      setPreviewUrl(undefined);
      onStagedFileChange(null);
    }
  };

  return (
    <div className={styles['photo-uploader']}>
      <div className={styles['photo-uploader__row']}>
        <div className={styles['photo-uploader__preview']}>
          <Avatar
            src={previewUrl}
            alt="Pré-visualização da foto do pet"
            size={68}
            shape="rounded"
            fallback={<PawIcon aria-hidden="true" />}
          />
        </div>

        <div className={styles['photo-uploader__info']}>
          <p className={styles['photo-uploader__title']}>
            Foto do paciente (opcional)
          </p>
          <p className={styles['photo-uploader__hint']}>
            JPEG, PNG ou WebP até 3 MB. Será comprimida e enviada após o
            cadastro.
          </p>

          <div className={styles['photo-uploader__actions']}>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_PATIENT_PHOTO_MIME_TYPES.join(',')}
              className={styles['photo-uploader__input']}
              onChange={handleFileChange}
              disabled={isBusy}
            />
            <Button
              type="button"
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <Camera aria-hidden="true" />
              <span>{stagedFile ? 'Trocar foto' : 'Selecionar foto'}</span>
            </Button>

            {stagedFile && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setLocalError(null);
                  setPreviewUrl(undefined);
                  onStagedFileChange(null);
                }}
                disabled={isBusy}
              >
                <Trash2 aria-hidden="true" />
                <span>Remover</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {isUploading && (
        <>
          <div
            className={styles['photo-uploader__progress-bar']}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={styles['photo-uploader__progress-fill']}
              style={{
                width: `${step === 'uploading-r2' ? Math.max(progress, 15) : 100}%`,
              }}
            />
          </div>
          <p className={styles['photo-uploader__status']}>
            {STEP_LABELS[step]}
            {step === 'uploading-r2' && progress > 0 ? ` (${progress}%)` : ''}
          </p>
        </>
      )}

      {localError && (
        <p className={styles['photo-uploader__error']} role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
