import clsx from 'clsx';

import type { IconComponent } from '@/interfaces/icon.types';

import styles from './segmented-control.module.scss';

export type SegmentedOption<TValue extends string> = {
  value: TValue;
  label: string;
  icon?: IconComponent;
};

type SegmentedControlProps<TValue extends string> = {
  options: SegmentedOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
};

export function SegmentedControl<TValue extends string>({ options, value, onChange, label }: SegmentedControlProps<TValue>) {
  return (
    <div className={styles['segmented-control']} role="tablist" aria-label={label}>
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
        const isSelected = optionValue === value;

        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={clsx(
              styles['segmented-control__option'],
              isSelected && styles['segmented-control__option--selected'],
            )}
            onClick={() => onChange(optionValue)}
          >
            {Icon && <Icon className={styles['segmented-control__option__icon']} aria-hidden="true" />}
            <span>{optionLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
