export interface NDEFRecordInit {
  recordType: 'empty' | 'text' | 'url' | 'mime' | 'unknown';
  mediaType?: string;
  id?: string;
  encoding?: string;
  lang?: string;
  data?: any;
}

export interface NDEFMessageInit {
  records: NDEFRecordInit[];
}

export interface NDEFReadingEvent extends Event {
  serialNumber: string;
  message: {
    records: Array<{
      recordType: string;
      mediaType?: string;
      id?: string;
      data?: DataView;
      encoding?: string;
      lang?: string;
      toRecords?: () => any[];
    }>;
  };
}

export declare class NDEFReader extends EventTarget {
  constructor();
  scan(options?: { signal?: AbortSignal }): Promise<void>;
  write(
    message: NDEFMessageInit | string,
    options?: { signal?: AbortSignal; overwrite?: boolean }
  ): Promise<void>;
  onreading: ((this: NDEFReader, ev: NDEFReadingEvent) => any) | null;
  onreadingerror: ((this: NDEFReader, ev: Event) => any) | null;
}

declare global {
  interface Window {
    NDEFReader?: typeof NDEFReader;
  }
}
