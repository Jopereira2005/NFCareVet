import type { IconComponent } from '@/interfaces/icon.types';

import styles from './section-label.module.scss';

type SectionLabelProps = {
  label: string;
  icon?: IconComponent;
};

/** Small uppercase label followed by a divider line, e.g. "Contatos" or "Observações". */
export function SectionLabel({ label, icon: Icon }: SectionLabelProps) {
  return (
    <div className={styles['section-label']}>
      <span className={styles['section-label__text']}>
        {Icon && <Icon aria-hidden="true" />}
        {label}
      </span>
      <span className={styles['section-label__line']} aria-hidden="true" />
    </div>
  );
}
