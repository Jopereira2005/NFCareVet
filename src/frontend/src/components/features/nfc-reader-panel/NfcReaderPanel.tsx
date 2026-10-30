import clsx from 'clsx';
import { Nfc } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import { StatusPill } from '@/components/ui';

import styles from './nfc-reader-panel.module.scss';

type NfcReaderPanelProps = {
  statusLabel: string;
  title: string;
  description: string;
  isScanning: boolean;
  error?: string | null;
  onActivate: () => void;
};

export function NfcReaderPanel({ statusLabel, title, description, isScanning, error, onActivate }: NfcReaderPanelProps) {
  return (
    <section className={styles['nfc-reader-panel']} aria-labelledby="nfc-reader-panel-title">
      <StatusPill label={statusLabel} tone="neutral" />

      <button
        type="button"
        className={clsx(styles['nfc-reader-panel__radar'], isScanning && styles['nfc-reader-panel__radar--scanning'])}
        aria-label="Ativar leitor NFC"
        onClick={onActivate}
      >
        <span className={clsx(styles['nfc-reader-panel__radar__ring'], styles['nfc-reader-panel__radar__ring--outer'])} />
        <span className={clsx(styles['nfc-reader-panel__radar__ring'], styles['nfc-reader-panel__radar__ring--middle'])} />
        <span className={clsx(styles['nfc-reader-panel__radar__ring'], styles['nfc-reader-panel__radar__ring--inner'])} />
        <span className={styles['nfc-reader-panel__radar__core']}>
          <span className={styles['nfc-reader-panel__core__icon']}>
            <Nfc aria-hidden="true" />
          </span>
          <span className={styles['nfc-reader-panel__core__spark']}>
            <PawIcon aria-hidden="true" />
          </span>
        </span>
      </button>

      <div className={styles['nfc-reader-panel__texts']}>
        <h2 id="nfc-reader-panel-title" className={styles['nfc-reader-panel__texts__title']}>
          {title}
        </h2>
        <p className={styles['nfc-reader-panel__texts__description']}>{description}</p>
        {error && (
          <p className={styles['nfc-reader-panel__texts__error']} role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
