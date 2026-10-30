import clsx from 'clsx';

import styles from './badge.module.scss';

export type BadgeTone = 'quaternary' | 'neutral' | 'dark' | 'danger' | 'warning' | 'success';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  /** Monospaced numbers, used for counters like "3 resultados". */
  mono?: boolean;
  className?: string;
};

export function Badge({ label, tone = 'quaternary', mono = false, className }: BadgeProps) {
  return (
    <span className={clsx(styles['badge'], styles[`badge--${tone}`], mono && styles['badge--mono'], className)}>
      {label}
    </span>
  );
}
