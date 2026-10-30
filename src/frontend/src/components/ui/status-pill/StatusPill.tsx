import clsx from 'clsx';

import styles from './status-pill.module.scss';

type StatusPillTone = 'success' | 'danger' | 'neutral';

type StatusPillProps = {
  label: string;
  tone?: StatusPillTone;
  className?: string;
};

export function StatusPill({ label, tone = 'success', className }: StatusPillProps) {
  return (
    <span className={clsx(styles['status-pill'], styles[`status-pill--${tone}`], className)} role="status">
      <span className={styles['status-pill__indicator']} aria-hidden="true">
        <span className={styles['status-pill__indicator__ping']} />
        <span className={styles['status-pill__indicator__dot']} />
      </span>
      <span className={styles['status-pill__label']}>{label}</span>
    </span>
  );
}
