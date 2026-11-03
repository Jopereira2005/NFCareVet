import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Crop, Image as ImageIcon, Trash2 } from 'lucide-react';
import { ALLOWED_PATIENT_PHOTO_MIME_TYPES } from '@nfcarevet/common';

import { PawIcon } from '@/assets/icons/paw-icon';
import { CameraCaptureModal } from '@/components/features/camera-capture-modal/CameraCaptureModal';
import {
  ImageCropperModal,
  type CroppingTarget,
} from '@/components/features/image-cropper-modal/ImageCropperModal';
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [croppingTarget, setCroppingTarget] = useState<CroppingTarget | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (croppingTarget) URL.revokeObjectURL(croppingTarget.url);
    };
  }, [croppingTarget]);

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

  const handleProcessSelectedFile = (file: File) => {
    try {
      validatePatientPhotoFile(file);
      setLocalError(null);
      if (croppingTarget) URL.revokeObjectURL(croppingTarget.url);
      setCroppingTarget({ file, url: URL.createObjectURL(file) });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Arquivo de imagem inválido.',
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    handleProcessSelectedFile(file);
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
            JPEG, PNG ou WebP até 3 MB. Tire uma foto na baia ou envie um arquivo.
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
              onClick={() => setIsCameraOpen(true)}
              disabled={isBusy}
            >
              <Camera aria-hidden="true" />
              <span>Tirar foto</span>
            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <ImageIcon aria-hidden="true" />
              <span>{patient.photoUrl ? 'Trocar arquivo' : 'Arquivo'}</span>
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

      {(localError ?? error) && (
        <p className={styles['photo-uploader__error']} role="alert">
          {localError ?? error}
        </p>
      )}

      {isCameraOpen && (
        <CameraCaptureModal
          title="Fotografar Paciente"
          shape="rounded"
          facingModeDefault="environment"
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            setIsCameraOpen(false);
            handleProcessSelectedFile(file);
          }}
        />
      )}

      {croppingTarget && (
        <ImageCropperModal
          target={croppingTarget}
          shape="rounded"
          confirmLabel="Confirmar e enviar"
          onCancel={() => {
            URL.revokeObjectURL(croppingTarget.url);
            setCroppingTarget(null);
          }}
          onConfirm={(croppedFile) => {
            URL.revokeObjectURL(croppingTarget.url);
            setCroppingTarget(null);
            void uploadPhoto(croppedFile);
          }}
        />
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [croppingTarget, setCroppingTarget] = useState<CroppingTarget | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (croppingTarget) URL.revokeObjectURL(croppingTarget.url);
    };
  }, [croppingTarget]);

  const isUploading = step !== 'idle';
  const isBusy = disabled || isUploading;

  const handleProcessSelectedFile = (file: File) => {
    try {
      validatePatientPhotoFile(file);
      setLocalError(null);
      setOriginalFile(file);
      if (croppingTarget) URL.revokeObjectURL(croppingTarget.url);
      setCroppingTarget({ file, url: URL.createObjectURL(file) });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'Arquivo de imagem inválido.',
      );
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    handleProcessSelectedFile(file);
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
            JPEG, PNG ou WebP até 3 MB. Tire uma foto na baia ou envie um arquivo.
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
              onClick={() => setIsCameraOpen(true)}
              disabled={isBusy}
            >
              <Camera aria-hidden="true" />
              <span>Tirar foto</span>
            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
            >
              <ImageIcon aria-hidden="true" />
              <span>{stagedFile ? 'Trocar arquivo' : 'Arquivo'}</span>
            </Button>

            {stagedFile && originalFile && (
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  if (croppingTarget) URL.revokeObjectURL(croppingTarget.url);
                  setCroppingTarget({
                    file: originalFile,
                    url: URL.createObjectURL(originalFile),
                  });
                }}
                disabled={isBusy}
              >
                <Crop aria-hidden="true" />
                <span>Enquadrar</span>
              </Button>
            )}

            {stagedFile && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setLocalError(null);
                  if (previewUrl) URL.revokeObjectURL(previewUrl);
                  setPreviewUrl(undefined);
                  setOriginalFile(null);
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

      {isCameraOpen && (
        <CameraCaptureModal
          title="Fotografar Paciente"
          shape="rounded"
          facingModeDefault="environment"
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            setIsCameraOpen(false);
            handleProcessSelectedFile(file);
          }}
        />
      )}

      {croppingTarget && (
        <ImageCropperModal
          target={croppingTarget}
          shape="rounded"
          onCancel={() => {
            URL.revokeObjectURL(croppingTarget.url);
            setCroppingTarget(null);
          }}
          onConfirm={(croppedFile) => {
            URL.revokeObjectURL(croppingTarget.url);
            setCroppingTarget(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(URL.createObjectURL(croppedFile));
            onStagedFileChange(croppedFile);
          }}
        />
      )}
    </div>
  );
}
