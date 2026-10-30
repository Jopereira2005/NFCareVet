import clsx from 'clsx';
import { Nfc } from 'lucide-react';

import type { NfcReaderStatus } from '@/interfaces/nfc.types';
import { useNfcStore } from '@/stores/useNfcStore';

import styles from './nfc-status-indicator.module.scss';

const STATUS_LABEL: Record<NfcReaderStatus, string> = {
  unsupported: 'Web NFC indisponível neste navegador; leitores USB continuam funcionando',
  idle: 'Ativar leitor NFC',
  scanning: 'Leitor NFC ativo: aproxime uma coleira para abrir o prontuário',
  error: 'Leitor NFC com erro. Toque para tentar novamente',
};

/** Header shortcut showing whether collars can be read right now; it starts the reader when it is off. */
export function NfcStatusIndicator() {
  const status = useNfcStore((state) => state.status);
  const error = useNfcStore((state) => state.error);
  const start = useNfcStore((state) => state.start);
  const className = clsx(styles['nfc-status-indicator'], styles[`nfc-status-indicator--${status}`]);
  const label = status === 'error' && error ? `${STATUS_LABEL.error} (${error})` : STATUS_LABEL[status];

  if (status === 'idle' || status === 'error') {
    return (
      <button type="button" className={className} aria-label={label} title={label} onClick={() => void start()}>
        <Nfc aria-hidden="true" />
      </button>
    );
  }

  return (
    <span className={className} role="img" aria-label={label} title={label}>
      <Nfc aria-hidden="true" />
    </span>
  );
}
