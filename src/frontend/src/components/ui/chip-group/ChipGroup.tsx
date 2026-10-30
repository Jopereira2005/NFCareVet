import type { ReactNode } from 'react';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './chip-group.module.scss';

type ChipGroupProps = {
  title: string;
  icon?: IconComponent;
  actionLabel?: string;
  onAction?: () => void;
  emptyLabel?: string;
  children?: ReactNode;
};

/** Titled row of chips, like "Buscas recentes" or "Filtros aplicados", with an optional clear action. */
export function ChipGroup({ title, icon: Icon, actionLabel, onAction, emptyLabel = 'Nada por aqui.', children }: ChipGroupProps) {
  const hasChips = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className={styles['chip-group']} aria-label={title}>
      <header className={styles['chip-group__header']}>
        <span className={styles['chip-group__header__title']}>
          {Icon && <Icon aria-hidden="true" />}
          {title}
        </span>
        {actionLabel && hasChips && (
          <button type="button" className={styles['chip-group__header__action']} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </header>

      {hasChips ? (
        <div className={styles['chip-group__list']}>{children}</div>
      ) : (
        <p className={styles['chip-group__empty']}>{emptyLabel}</p>
      )}
    </section>
  );
}
