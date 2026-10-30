import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './stat-card.module.scss';

type StatCardTone = 'default' | 'danger';

type StatCardProps = {
  label: string;
  icon: IconComponent;
  totalLabel: string;
  caption: string;
  value: string;
  detail: string;
  tone?: StatCardTone;
};

export function StatCard({ label, icon: Icon, totalLabel, caption, value, detail, tone = 'default' }: StatCardProps) {
  return (
    <article className={clsx(styles['stat-card'], styles[`stat-card--${tone}`])}>
      <header className={styles['stat-card__header']}>
        <div className={styles['stat-card__header__title']}>
          <Icon className={styles['stat-card__title__icon']} aria-hidden="true" />
          <h3 className={styles['stat-card__title__label']}>{label}</h3>
        </div>
        <span className={styles['stat-card__header__total']}>{totalLabel}</span>
      </header>

      <div className={styles['stat-card__panel']}>
        <span className={styles['stat-card__panel__caption']}>{caption}</span>
        <strong className={styles['stat-card__panel__value']}>{value}</strong>
        <span className={styles['stat-card__panel__detail']}>{detail}</span>
      </div>
    </article>
  );
}
