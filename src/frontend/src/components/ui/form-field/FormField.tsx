import type { ReactNode } from 'react';

import { getFieldDescribedBy, type FieldMessages } from '@/utils/getFieldDescribedBy';

import styles from './form-field.module.scss';

type FormFieldProps = FieldMessages & {
  id: string;
  label: string;
  /** Marks the label with "(opcional)"; required fields stay unmarked, which keeps long forms quieter. */
  optional?: boolean;
  /** `legend` for groups of controls (radio chips), rendered as a fieldset. */
  as?: 'label' | 'legend';
  children: ReactNode;
};

/** Label + control + hint/error, shared by every form control so they look and announce the same way. */
export function FormField({ id, label, optional = false, hint, error, as = 'label', children }: FormFieldProps) {
  const labelContent = (
    <>
      {label}
      {optional && <span className={styles['form-field__label__optional']}> (opcional)</span>}
    </>
  );

  const messages = (
    <>
      {hint && !error && (
        <p id={`${id}-hint`} className={styles['form-field__hint']}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles['form-field__error']} role="alert">
          {error}
        </p>
      )}
    </>
  );

  if (as === 'legend') {
    return (
      <fieldset className={styles['form-field']} aria-describedby={getFieldDescribedBy(id, { hint, error })}>
        <legend className={styles['form-field__label']}>{labelContent}</legend>
        {children}
        {messages}
      </fieldset>
    );
  }

  return (
    <div className={styles['form-field']}>
      <label className={styles['form-field__label']} htmlFor={id}>
        {labelContent}
      </label>
      {children}
      {messages}
    </div>
  );
}
