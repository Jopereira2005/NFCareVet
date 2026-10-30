import type { ComponentProps } from 'react';
import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './icon-button.module.scss';

type IconButtonProps = Omit<ComponentProps<'button'>, 'children' | 'aria-label'> & {
  icon: IconComponent;
  /** Accessible name; also shown as the tooltip, since the button has no visible text. */
  label: string;
};

/** Small round button holding only an icon, e.g. "edit" shortcuts on cards. */
export function IconButton({ icon: Icon, label, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} className={clsx(styles['icon-button'], className)} aria-label={label} title={label} {...props}>
      <Icon aria-hidden="true" />
    </button>
  );
}
