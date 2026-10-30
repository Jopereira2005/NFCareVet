import { useEffect, useEffectEvent } from 'react';
import clsx from 'clsx';
import { Check, TriangleAlert } from 'lucide-react';

import styles from './toast.module.scss';

type ToastTone = 'success' | 'warning';

type ToastProps = {
  title: string;
  description?: string;
  tone?: ToastTone;
  actionLabel?: string;
  /** Auto-dismiss delay in ms; 0 keeps it open until the action is pressed. */
  duration?: number;
  onClose: () => void;
};

/** Floating notification pinned above the navbar. Render it only while it should be visible; give each message its own `key` to restart the timer. */
export function Toast({ title, description, tone = 'success', actionLabel = 'OK', duration = 4000, onClose }: ToastProps) {
  // Effect event: a new `onClose` reference from the parent doesn't restart the timer
  const handleTimeout = useEffectEvent(onClose);

  useEffect(() => {
    if (duration === 0) return;

    const timeoutId = window.setTimeout(handleTimeout, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration]);

  const Icon = tone === 'success' ? Check : TriangleAlert;

  return (
    <div className={clsx(styles['toast'], styles[`toast--${tone}`])} role="status" aria-live="polite">
      <span className={styles['toast__icon']}>
        <Icon aria-hidden="true" />
      </span>
      <div className={styles['toast__texts']}>
        <p className={styles['toast__texts__title']}>{title}</p>
        {description && <p className={styles['toast__texts__description']}>{description}</p>}
      </div>
      <button type="button" className={styles['toast__action']} onClick={onClose}>
        {actionLabel}
      </button>
    </div>
  );
}
