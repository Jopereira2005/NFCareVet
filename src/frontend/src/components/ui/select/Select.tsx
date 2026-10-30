import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

import { getFieldDescribedBy } from '@/utils/getFieldDescribedBy';

import { FormField } from '../form-field/FormField';

import styles from './select.module.scss';

export type SelectOption = {
  value: string;
  label: string;
  /** Listed but not selectable, e.g. an occupied kennel. */
  disabled?: boolean;
};

type SelectProps = ComponentProps<'select'> & {
  id: string;
  label: string;
  options: SelectOption[];
  /** First, empty option; shown until the user picks something. */
  placeholder?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
};

/** Native select (best mobile UX: the OS picker) styled like the text inputs. */
export function Select({ id, label, options, placeholder, hint, error, optional, className, ...selectProps }: SelectProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} optional={optional}>
      <div className={clsx(styles['select'], error && styles['select--invalid'])}>
        <select
          {...selectProps}
          id={id}
          className={clsx(styles['select__field'], className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={getFieldDescribedBy(id, { hint, error })}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className={styles['select__chevron']} aria-hidden="true" />
      </div>
    </FormField>
  );
}
