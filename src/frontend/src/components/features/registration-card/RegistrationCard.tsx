import type { ReactNode } from 'react';
import clsx from 'clsx';

import { Badge } from '@/components/ui/badge/Badge';
import { TagInfo } from '@/components/ui/tag-info/TagInfo';
import type { IconComponent } from '@/interfaces/icon.types';

import styles from './registration-card.module.scss';

type RegistrationCardTone = 'highlight' | 'muted';

type RegistrationCardDetail = {
  icon: IconComponent;
  label: string;
  tone?: RegistrationCardTone;
};

type RegistrationCardProps = {
  title: string;
  badgeLabel: string;
  description: string;
  descriptionHighlight: string;
  avatar: ReactNode;
  identifier: RegistrationCardDetail;
  status: RegistrationCardDetail;
  timestamp: RegistrationCardDetail;
  actionLabel: string;
  onAction?: () => void;
};

export function RegistrationCard({
  title,
  badgeLabel,
  description,
  descriptionHighlight,
  avatar,
  identifier,
  status,
  timestamp,
  actionLabel,
  onAction,
}: RegistrationCardProps) {
  return (
    <article className={styles['registration-card']}>
      <div className={styles['registration-card__content']}>
        {avatar}

        <div className={styles['registration-card__content__body']}>
          <header className={styles['registration-card__body__header']}>
            <h3 className={styles['registration-card__header__title']}>{title}</h3>
            <Badge label={badgeLabel} />
          </header>

          <p className={styles['registration-card__body__description']}>
            {description}{' '}
            <span className={styles['registration-card__description__highlight']}>{descriptionHighlight}</span>
          </p>

          <TagInfo identifier={identifier} status={status} />
        </div>
      </div>

      <footer className={styles['registration-card__footer']}>
        <span
          className={clsx(
            styles['registration-card__footer__timestamp'],
            styles[`registration-card__footer__timestamp--${timestamp.tone ?? 'highlight'}`],
          )}
        >
          <timestamp.icon aria-hidden="true" />
          <span>{timestamp.label}</span>
        </span>

        <button type="button" className={styles['registration-card__footer__action']} onClick={onAction}>
          {actionLabel}
        </button>
      </footer>
    </article>
  );
}
