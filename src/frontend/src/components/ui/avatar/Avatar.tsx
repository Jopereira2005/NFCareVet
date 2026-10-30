import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';

import styles from './avatar.module.scss';

type AvatarShape = 'circle' | 'rounded';
type AvatarBadgeTone = 'dark' | 'secondary';

type AvatarBadge = {
  tone: AvatarBadgeTone;
  content?: ReactNode;
};

type AvatarProps = {
  alt: string;
  size: number;
  src?: string;
  shape?: AvatarShape;
  fallback?: ReactNode;
  badge?: AvatarBadge;
  className?: string;
};

const PX_PER_REM = 10;

export function Avatar({ alt, size, src, shape = 'circle', fallback, badge, className }: AvatarProps) {
  const style = { '--avatar-size': `${size / PX_PER_REM}rem` } as CSSProperties;

  return (
    <div className={clsx(styles['avatar'], className)} style={style}>
      <div className={clsx(styles['avatar__frame'], styles[`avatar__frame--${shape}`])}>
        {src ? (
          <img className={styles['avatar__frame__image']} src={src} alt={alt} />
        ) : (
          <span className={styles['avatar__frame__fallback']} role="img" aria-label={alt}>
            {fallback}
          </span>
        )}
      </div>

      {badge && (
        <span
          className={clsx(styles['avatar__badge'], styles[`avatar__badge--${badge.tone}`])}
          aria-hidden="true"
        >
          {badge.content}
        </span>
      )}
    </div>
  );
}
