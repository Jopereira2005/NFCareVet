import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Loader2, SwitchCamera } from 'lucide-react';

import { Button, Modal } from '@/components/ui';

import styles from './camera-capture-modal.module.scss';

type CameraCaptureModalProps = {
  title?: string;
  shape?: 'rounded' | 'circle';
  facingModeDefault?: 'user' | 'environment';
  onCapture: (file: File) => void;
  onClose: () => void;
};

export function CameraCaptureModal({
  title = 'Tirar Foto com a Câmera',
  shape = 'rounded',
  facingModeDefault = 'environment',
  onCapture,
  onClose,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(facingModeDefault);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCurrentStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    // Detecta se o aparelho possui mais de uma câmera (traseira e frontal)
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      }).catch(() => {
        // Ignora erro de enumeração
      });
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function initCamera() {
      setIsLoading(true);
      setCameraError(null);
      stopCurrentStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Seu navegador ou dispositivo não possui suporte para captura de vídeo pela câmera.');
        setIsLoading(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsLoading(false);
      } catch (err) {
        if (isCancelled) return;
        setIsLoading(false);
        const errorMsg =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Permissão de acesso à câmera negada. Habilite a permissão nas configurações do navegador.'
            : 'Não foi possível acessar a câmera do dispositivo. Verifique se outro app já está usando a câmera.';
        setCameraError(errorMsg);
      }
    }

    void initCamera();

    return () => {
      isCancelled = true;
      stopCurrentStream();
    };
  }, [facingMode]);

  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleTakeShutter = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Se a câmera for frontal ('user'), espelha horizontalmente para parecer natural
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        stopCurrentStream();
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <Modal
      title={title}
      description="Posicione a foto e clique no botão de captura. Você poderá ajustar o enquadramento em seguida."
      onClose={onClose}
      footer={
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
      }
    >
      <div className={styles['camera-modal']}>
        <div className={styles['camera-modal__viewfinder']}>
          {isLoading && (
            <div className={styles['camera-modal__loading']}>
              <Loader2 aria-hidden="true" />
              <span>Iniciando câmera…</span>
            </div>
          )}

          {cameraError && (
            <div className={styles['camera-modal__error']}>
              <CameraOff aria-hidden="true" />
              <p>{cameraError}</p>
            </div>
          )}

          <video
            ref={videoRef}
            playsInline
            muted
            className={`${styles['camera-modal__video']} ${
              facingMode === 'user' ? styles['camera-modal__video--mirror'] : ''
            }`}
            style={{ display: isLoading || cameraError ? 'none' : 'block' }}
          />

          {!isLoading && !cameraError && (
            <div
              className={`${styles['camera-modal__mask']} ${
                styles[`camera-modal__mask--${shape}`]
              }`}
            />
          )}
        </div>

        {!cameraError && (
          <div className={styles['camera-modal__actions']}>
            {hasMultipleCameras && (
              <button
                type="button"
                className={styles['camera-modal__switch-btn']}
                onClick={handleSwitchCamera}
                disabled={isLoading}
                title="Alternar câmera (Frontal / Traseira)"
                aria-label="Alternar câmera frontal ou traseira"
              >
                <SwitchCamera aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              className={styles['camera-modal__shutter-btn']}
              onClick={handleTakeShutter}
              disabled={isLoading}
            >
              <Camera aria-hidden="true" />
              <span>Capturar foto</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
