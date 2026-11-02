import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './tag-info.module.scss';

type TagInfoTone = 'highlight' | 'muted';

type TagInfoItem = {
  icon: IconComponent;
  label: string;
};

type TagInfoProps = {
  identifier: TagInfoItem;
  status: TagInfoItem & { tone?: TagInfoTone };
};

/** Gray strip with an identifier on the left and a status on the right, e.g. "#VET-8831 · Tag Ativa". */
export function TagInfo({ identifier, status }: TagInfoProps) {
  const { icon: IdentifierIcon } = identifier;
  const { icon: StatusIcon, tone = 'highlight' } = status;

  return (
    <div className={styles['tag-info']}>
      <span className={styles['tag-info__identifier']} title={identifier.label}>
        <IdentifierIcon className={styles['tag-info__identifier__icon']} aria-hidden="true" />
        <span className={styles['tag-info__identifier__text']}>{identifier.label}</span>
      </span>
      <span className={clsx(styles['tag-info__status'], styles[`tag-info__status--${tone}`])} title={status.label}>
        <StatusIcon className={styles['tag-info__status__icon']} aria-hidden="true" />
        <span className={styles['tag-info__status__text']}>{status.label}</span>
      </span>
    </div>
  );
}
