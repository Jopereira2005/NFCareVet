import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import { FormField } from '../form-field/FormField';

import styles from './choice-group.module.scss';

export type ChoiceOption<TValue extends string> = {
  value: TValue;
  label: string;
  icon?: IconComponent;
};

type ChoiceGroupProps<TValue extends string> = {
  name: string;
  label: string;
  options: ChoiceOption<TValue>[];
  value: TValue | '' | undefined;
  onChange: (value: TValue) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  disabled?: boolean;
};

/**
 * Single choice shown as chips. Built on native radio inputs, so arrow keys,
 * form semantics and screen readers work without extra code.
 */
export function ChoiceGroup<TValue extends string>({
  name,
  label,
  options,
  value,
  onChange,
  error,
  hint,
  optional,
  disabled,
}: ChoiceGroupProps<TValue>) {
  return (
    <FormField id={name} label={label} hint={hint} error={error} optional={optional} as="legend">
      <div className={styles['choice-group']}>
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
          const isSelected = optionValue === value;

          return (
            <label
              key={optionValue}
              className={clsx(styles['choice-group__option'], isSelected && styles['choice-group__option--selected'])}
            >
              <input
                className={styles['choice-group__option__input']}
                type="radio"
                name={name}
                value={optionValue}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(optionValue)}
              />
              {Icon && <Icon aria-hidden="true" />}
              {optionLabel}
            </label>
          );
        })}
      </div>
    </FormField>
  );
}
