import type { ComponentProps } from 'react';

import styles from './checkbox.module.scss';

type CheckboxProps = Omit<ComponentProps<'input'>, 'children' | 'type'> & {
  label: string;
};

export function Checkbox({ label, ...inputProps }: CheckboxProps) {
  return (
    <label className={styles['checkbox']}>
      <input {...inputProps} type="checkbox" />
      <span className={styles['checkbox__box']} aria-hidden="true" />
      <span className={styles['checkbox__label']}>{label}</span>
    </label>
  );
}
