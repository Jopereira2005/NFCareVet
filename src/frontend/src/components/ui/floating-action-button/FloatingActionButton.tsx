import type { IconComponent } from '@/interfaces/icon.types';

import styles from './floating-action-button.module.scss';

type FloatingActionButtonProps = {
  label: string;
  icon: IconComponent;
  onClick?: () => void;
};

/** Pill button pinned above the navbar, e.g. "+ Nova Atividade". */
export function FloatingActionButton({ label, icon: Icon, onClick }: FloatingActionButtonProps) {
  return (
    <button type="button" className={styles['floating-action-button']} onClick={onClick}>
      <Icon className={styles['floating-action-button__icon']} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
