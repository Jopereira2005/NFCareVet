import type { ComponentProps } from 'react';
import clsx from 'clsx';

import { getFieldDescribedBy } from '@/utils/getFieldDescribedBy';

import { FormField } from '../form-field/FormField';

import styles from './textarea.module.scss';

type TextareaProps = ComponentProps<'textarea'> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

export function Textarea({ id, label, hint, error, optional, className, rows = 3, ...textareaProps }: TextareaProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        {...textareaProps}
        id={id}
        rows={rows}
        className={clsx(styles['textarea'], error && styles['textarea--invalid'], className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={getFieldDescribedBy(id, { hint, error })}
      />
    </FormField>
  );
}
