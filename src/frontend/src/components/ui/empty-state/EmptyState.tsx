import type { ReactNode } from 'react';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './empty-state.module.scss';

type EmptyStateProps = {
  icon: IconComponent;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <section className={styles['empty-state']}>
      <span className={styles['empty-state__icon']}>
        <Icon aria-hidden="true" />
      </span>
      <h2 className={styles['empty-state__title']}>{title}</h2>
      {description && <p className={styles['empty-state__description']}>{description}</p>}
      {action}
    </section>
  );
}
