export interface NfcReading {
  serialNumber: string;
  /** Serial number without separators, uppercased: "04:A1:B2" → "04A1B2". */
  uid: string;
}

export type NfcReaderStatus = 'unsupported' | 'idle' | 'scanning' | 'error';

export interface NfcTagOccupant {
  hospitalizationId: string;
  patientId: string;
  patientName: string;
  species: string;
  kennelName: string;
}

export interface NfcTagInventoryItem {
  id: string;
  tagUid: string;
  publicCode: string;
  active: boolean;
  targetUrl?: string;
  createdAt: string | Date;
  occupant?: NfcTagOccupant | null;
}

// Minimal Web NFC typings (Chrome on Android); not shipped with TypeScript's DOM lib.
export interface NdefReadingEvent extends Event {
  serialNumber: string;
}

export interface NdefRecordInit {
  recordType: 'url' | 'text' | string;
  data?: string;
}

export interface NdefMessageInit {
  records: NdefRecordInit[];
}

export interface NdefReader extends EventTarget {
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(message: NdefMessageInit | string, options?: { signal?: AbortSignal }): Promise<void>;
  onreading: ((event: NdefReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
}

declare global {
  interface Window {
    NDEFReader?: new () => NdefReader;
  }
}
