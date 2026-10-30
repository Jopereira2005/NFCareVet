import type { ReactNode } from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './section-header.module.scss';

type SectionHeaderSize = 'sm' | 'md' | 'lg';

type SectionHeaderAction = {
  label: string;
  to: string;
};

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  size?: SectionHeaderSize;
  icon?: IconComponent;
  action?: SectionHeaderAction;
  /** Content shown on the right instead of a link, e.g. a counter badge. */
  aside?: ReactNode;
  titleId?: string;
};

export function SectionHeader({ title, subtitle, size = 'md', icon: Icon, action, aside, titleId }: SectionHeaderProps) {
  return (
    <div className={styles['section-header']}>
      <div className={styles['section-header__heading']}>
        {Icon && <Icon className={styles['section-header__heading__icon']} aria-hidden="true" />}
        <div className={styles['section-header__heading__texts']}>
          <h2 id={titleId} className={clsx(styles['section-header__texts__title'], styles[`section-header__texts__title--${size}`])}>
            {title}
          </h2>
          {subtitle && <p className={styles['section-header__texts__subtitle']}>{subtitle}</p>}
        </div>
      </div>

      {action && (
        <Link className={styles['section-header__action']} to={action.to}>
          <span>{action.label}</span>
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
      {aside}
    </div>
  );
}
