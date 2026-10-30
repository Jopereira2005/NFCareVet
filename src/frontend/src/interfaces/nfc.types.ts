export interface NfcReading {
  serialNumber: string;
  /** Serial number without separators, uppercased: "04:A1:B2" → "04A1B2". */
  uid: string;
}

export type NfcReaderStatus = 'unsupported' | 'idle' | 'scanning' | 'error';

// Minimal Web NFC typings (Chrome on Android); not shipped with TypeScript's DOM lib.
export interface NdefReadingEvent extends Event {
  serialNumber: string;
}

export interface NdefReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((event: NdefReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    NDEFReader?: new () => NdefReader;
  }
}
