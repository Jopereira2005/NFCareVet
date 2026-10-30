import clsx from 'clsx';
import { Calendar } from 'lucide-react';

import type { HistoryPeriod } from '@/interfaces/hospitalization.types';

import styles from './period-selector.module.scss';

export type PeriodOption = {
  period: HistoryPeriod;
  label: string;
  /** Undefined while the counts are loading. */
  total?: number;
};

type PeriodSelectorProps = {
  periods: PeriodOption[];
  value: HistoryPeriod;
  onChange: (period: HistoryPeriod) => void;
};

export function PeriodSelector({ periods, value, onChange }: PeriodSelectorProps) {
  return (
    <div className={styles['period-selector']} role="radiogroup" aria-label="Período">
      {periods.map(({ period, label, total }) => {
        const isSelected = period === value;

        return (
          <button
            key={period}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={clsx(styles['period-selector__option'], isSelected && styles['period-selector__option--selected'])}
            onClick={() => onChange(period)}
          >
            <span className={styles['period-selector__option__header']}>
              <Calendar aria-hidden="true" />
              {label}
            </span>
            <strong className={styles['period-selector__option__total']}>{total ?? '–'}</strong>
            <span className={styles['period-selector__option__caption']}>Registros</span>
          </button>
        );
      })}
    </div>
  );
}
