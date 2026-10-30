import { useEffect, useEffectEvent } from 'react';

import type { NfcReading } from '@/interfaces/nfc.types';
import { claimNfcReader, emitNfcReading, useNfcStore } from '@/stores/useNfcStore';

type UseNfcReaderOptions = {
  onRead: (reading: NfcReading) => void;
};

/**
 * Takes over the app-wide NFC reader while the calling screen is mounted: readings go to `onRead`
 * instead of opening the patient record. `start` must run from a user gesture; on unsupported
 * browsers `simulate` feeds a fake reading for development.
 */
export function useNfcReader({ onRead }: UseNfcReaderOptions) {
  const status = useNfcStore((state) => state.status);
  const error = useNfcStore((state) => state.error);
  const start = useNfcStore((state) => state.start);
  const handleRead = useEffectEvent(onRead);

  useEffect(() => claimNfcReader((reading) => handleRead(reading)), []);

  return { status, error, isSupported: status !== 'unsupported', start, simulate: emitNfcReading };
}
