import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

import styles from './modal.module.scss';

type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Action bar pinned to the bottom (cancel / confirm buttons). */
  footer?: ReactNode;
};

/**
 * Bottom sheet on phones, centered dialog on wider screens. Built on the native <dialog> with
 * `showModal()`: focus trap, Esc, inert background and top layer come from the browser.
 * The modal is open while mounted — render it conditionally (`{isOpen && <Modal />}`), which also
 * gives every opening a fresh form.
 */
export function Modal({ title, description, onClose, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const handleClose = useEffectEvent(onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    const handleCancel = (event: Event) => {
      // Esc: let React decide (and unmount) instead of the browser closing the element on its own
      event.preventDefault();
      handleClose();
    };
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles['modal']}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // A click on the backdrop lands on the <dialog> itself, never on its content
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className={styles['modal__panel']}>
        <header className={styles['modal__panel__header']}>
          <span className={styles['modal__header__handle']} aria-hidden="true" />
          <div className={styles['modal__header__texts']}>
            <h2 id={titleId} className={styles['modal__texts__title']}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={styles['modal__texts__description']}>
                {description}
              </p>
            )}
          </div>
          <button type="button" className={styles['modal__header__close']} aria-label="Fechar" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles['modal__panel__body']}>{children}</div>

        {footer && <footer className={styles['modal__panel__footer']}>{footer}</footer>}
      </div>
    </dialog>
  );
}
