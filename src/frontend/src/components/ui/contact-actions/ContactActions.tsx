import type { CSSProperties } from 'react';
import { MessageSquareText, Phone } from 'lucide-react';

import styles from './contact-actions.module.scss';

type ContactActionsProps = {
  name: string;
  phone: string;
  /** Button diameter in px from the design (28, 32 or 36). */
  size?: number;
  onMessage?: () => void;
};

const PX_PER_REM = 10;

/** Round "send message" and "call" shortcuts shown next to a guardian's contact. */
export function ContactActions({ name, phone, size = 32, onMessage }: ContactActionsProps) {
  const style = { '--contact-action-size': `${size / PX_PER_REM}rem` } as CSSProperties;

  return (
    <div className={styles['contact-actions']} style={style}>
      <button
        type="button"
        className={`${styles['contact-actions__button']} ${styles['contact-actions__button--message']}`}
        aria-label={`Enviar mensagem para ${name}`}
        onClick={onMessage}
      >
        <MessageSquareText aria-hidden="true" />
      </button>
      <a
        className={`${styles['contact-actions__button']} ${styles['contact-actions__button--call']}`}
        href={`tel:${phone.replace(/\D/g, '')}`}
        aria-label={`Ligar para ${name}`}
      >
        <Phone aria-hidden="true" />
      </a>
    </div>
  );
}
