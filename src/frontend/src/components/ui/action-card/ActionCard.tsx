import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './action-card.module.scss';

type ActionCardVariant = 'primary' | 'default';

type ActionCardProps = {
  title: string;
  description?: string;
  icon: IconComponent;
  variant?: ActionCardVariant;
  onClick?: () => void;
};

export function ActionCard({ title, description, icon: Icon, variant = 'default', onClick }: ActionCardProps) {
  return (
    <button
      type="button"
      className={clsx(styles['action-card'], styles[`action-card--${variant}`])}
      onClick={onClick}
    >
      <span className={styles['action-card__icon-wrapper']}>
        <Icon aria-hidden="true" />
      </span>
      <span className={styles['action-card__title']}>{title}</span>
      {description && <span className={styles['action-card__description']}>{description}</span>}
    </button>
  );
}
