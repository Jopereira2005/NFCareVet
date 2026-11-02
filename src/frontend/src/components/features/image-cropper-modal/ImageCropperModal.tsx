import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

import { Button, Modal } from '@/components/ui';

import styles from './image-cropper-modal.module.scss';

const STAGE_SIZE_PX = 260;
const MASK_INSET_PX = 16;
const CROP_BOX_SIZE_PX = STAGE_SIZE_PX - MASK_INSET_PX * 2; // 228px
const OUTPUT_SIZE_PX = 800;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

export type CroppingTarget = {
  file: File;
  url: string;
};

type ImageCropperModalProps = {
  target: CroppingTarget;
  shape?: 'rounded' | 'circle';
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
};

export function ImageCropperModal({
  target,
  shape = 'rounded',
  confirmLabel = 'Confirmar enquadramento',
  onCancel,
  onConfirm,
}: ImageCropperModalProps) {
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );

  // Base scale so the shortest side of the image covers the crop box (CROP_BOX_SIZE_PX)
  const baseScale = naturalSize
    ? Math.max(CROP_BOX_SIZE_PX / naturalSize.width, CROP_BOX_SIZE_PX / naturalSize.height)
    : 1;

  const clampOffset = (
    nextX: number,
    nextY: number,
    targetZoom: number,
    dims: { width: number; height: number } | null,
  ) => {
    if (!dims) return { x: nextX, y: nextY };
    const effectiveScale =
      Math.max(CROP_BOX_SIZE_PX / dims.width, CROP_BOX_SIZE_PX / dims.height) * targetZoom;
    const renderedWidth = dims.width * effectiveScale;
    const renderedHeight = dims.height * effectiveScale;

    const maxOffsetX = Math.max(0, (renderedWidth - CROP_BOX_SIZE_PX) / 2);
    const maxOffsetY = Math.max(0, (renderedHeight - CROP_BOX_SIZE_PX) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, nextX)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, nextY)),
    };
  };

  const applyZoom = (nextZoom: number) => {
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));
    setZoom(clampedZoom);
    setOffset((prev) => clampOffset(prev.x, prev.y, clampedZoom, naturalSize));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = event.clientX - dragStartRef.current.startX;
    const dy = event.clientY - dragStartRef.current.startY;
    setOffset(
      clampOffset(
        dragStartRef.current.origX + dx,
        dragStartRef.current.origY + dy,
        zoom,
        naturalSize,
      ),
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    applyZoom(zoom + delta);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!imgRef.current || !naturalSize) return;
    setIsProcessing(true);

    try {
      const effectiveScale = baseScale * zoom;
      const renderedWidth = naturalSize.width * effectiveScale;
      const renderedHeight = naturalSize.height * effectiveScale;

      // Top-left of crop box relative to top-left of rendered image
      const cropLeftInRendered = (renderedWidth - CROP_BOX_SIZE_PX) / 2 - offset.x;
      const cropTopInRendered = (renderedHeight - CROP_BOX_SIZE_PX) / 2 - offset.y;

      // Convert to source image coordinates
      const srcX = cropLeftInRendered / effectiveScale;
      const srcY = cropTopInRendered / effectiveScale;
      const srcSize = CROP_BOX_SIZE_PX / effectiveScale;

      const outputDimension = Math.min(OUTPUT_SIZE_PX, Math.max(256, Math.round(srcSize)));
      const canvas = document.createElement('canvas');
      canvas.width = outputDimension;
      canvas.height = outputDimension;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Falha ao processar o recorte da imagem.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        imgRef.current,
        srcX,
        srcY,
        srcSize,
        srcSize,
        0,
        0,
        outputDimension,
        outputDimension,
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (res) => {
            if (res) {
              resolve(res);
              return;
            }
            canvas.toBlob(
              (fallback) =>
                fallback ? resolve(fallback) : reject(new Error('Erro ao exportar imagem.')),
              'image/jpeg',
              0.85,
            );
          },
          'image/webp',
          0.85,
        );
      });

      const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
      const croppedFile = new File([blob], `cropped-${Date.now()}.${ext}`, {
        type: blob.type,
      });

      onConfirm(croppedFile);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderedWidth = naturalSize ? naturalSize.width * baseScale : CROP_BOX_SIZE_PX;
  const renderedHeight = naturalSize ? naturalSize.height * baseScale : CROP_BOX_SIZE_PX;

  return (
    <Modal
      title="Ajustar Enquadramento"
      description="Arraste a imagem para posicionar e ajuste o nível de zoom antes de salvar."
      onClose={onCancel}
      footer={
        <>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleConfirm()}
            disabled={!naturalSize || isProcessing}
          >
            <Check aria-hidden="true" />
            <span>{isProcessing ? 'Processando…' : confirmLabel}</span>
          </Button>
        </>
      }
    >
      <div className={styles['cropper']}>
        <div
          className={`${styles['cropper__stage']} ${
            isDragging ? styles['cropper__stage--dragging'] : ''
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={target.url}
            alt="Enquadramento da foto"
            className={styles['cropper__image']}
            onLoad={(e) => {
              setNaturalSize({
                width: e.currentTarget.naturalWidth || 400,
                height: e.currentTarget.naturalHeight || 400,
              });
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            style={{
              width: `${renderedWidth}px`,
              height: `${renderedHeight}px`,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
            }}
            draggable={false}
          />

          <div className={`${styles['cropper__grid']} ${styles[`cropper__grid--${shape}`]}`} />
          <div className={`${styles['cropper__mask']} ${styles[`cropper__mask--${shape}`]}`} />
        </div>

        <p className={styles['cropper__hint']}>
          Arraste a foto com o mouse ou toque na tela para centralizar o rosto.
        </p>

        <div className={styles['cropper__controls']}>
          <button
            type="button"
            className={styles['cropper__zoom-btn']}
            onClick={() => applyZoom(zoom - ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Diminuir zoom"
            title="Diminuir zoom"
          >
            <ZoomOut aria-hidden="true" />
          </button>

          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            className={styles['cropper__slider']}
            aria-label="Nível de zoom"
          />

          <button
            type="button"
            className={styles['cropper__zoom-btn']}
            onClick={() => applyZoom(zoom + ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Aumentar zoom"
            title="Aumentar zoom"
          >
            <ZoomIn aria-hidden="true" />
          </button>

          <span className={styles['cropper__zoom-value']}>{Math.round(zoom * 100)}%</span>

          <button
            type="button"
            className={styles['cropper__zoom-btn']}
            onClick={handleReset}
            disabled={zoom === 1 && offset.x === 0 && offset.y === 0}
            aria-label="Restaurar posição original"
            title="Restaurar posição original"
          >
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
      </div>
    </Modal>
  );
}
