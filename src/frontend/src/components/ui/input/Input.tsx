import type { ComponentProps, ReactNode } from 'react';
import clsx from 'clsx';

import { getFieldDescribedBy } from '@/utils/getFieldDescribedBy';

import { FormField } from '../form-field/FormField';

import styles from './input.module.scss';

type InputProps = ComponentProps<'input'> & {
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  hint?: string;
  error?: string;
  optional?: boolean;
} & ({ label: string; id: string } | { label?: undefined; id?: string });

/** Text-like input. `ref` (React 19 prop) reaches the native input, so it works with React Hook Form's `register`. */
export function Input({ className, id, label, leadingIcon, trailingAction, hint, error, optional, ...inputProps }: InputProps) {
  const control = (
    <div className={clsx(styles['input__control'], error && styles['input__control--invalid'])}>
      {leadingIcon && (
        <span className={styles['input__control__leading-icon']} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      <input
        {...inputProps}
        id={id}
        className={clsx(styles['input__control__field'], className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={id ? getFieldDescribedBy(id, { hint, error }) : undefined}
      />
      {trailingAction}
    </div>
  );

  if (!label) return control;

  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      {control}
    </FormField>
  );
}
