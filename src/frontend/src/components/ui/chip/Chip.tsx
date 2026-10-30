import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './chip.module.scss';

export type ChipTone = 'default' | 'info' | 'warning' | 'danger';

/** Data for a chip in a list (recent searches, applied filters). */
export type ChipOption = {
  id: string;
  label: string;
  icon?: IconComponent;
  tone?: ChipTone;
};

type ChipProps = Omit<ChipOption, 'id'> & {
  /** Accessible name when the click does something other than what the label says, e.g. "Remover filtro Macho". */
  ariaLabel?: string;
  onClick?: () => void;
};

export function Chip({ label, icon: Icon, tone = 'default', ariaLabel, onClick }: ChipProps) {
  return (
    <button type="button" className={clsx(styles['chip'], styles[`chip--${tone}`])} aria-label={ariaLabel} onClick={onClick}>
      {Icon && <Icon className={styles['chip__icon']} aria-hidden="true" />}
      <span>{label}</span>
    </button>
  );
}
