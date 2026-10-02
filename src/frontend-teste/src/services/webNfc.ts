export interface NfcScanResult {
  serialNumber: string;
  formattedUid: string;
}

export function isWebNfcSupported(): boolean {
  return typeof window !== 'undefined' && 'NDEFReader' in window;
}

export function cleanTagUid(rawUid: string): string {
  return rawUid.replace(/[:\s-]/g, '').toUpperCase();
}

/**
 * Inicia a leitura contínua de tag NFC via Web NFC (Chrome Android)
 */
export async function startNfcScan(
  onRead: (result: NfcScanResult) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal
): Promise<void> {
  if (!isWebNfcSupported()) {
    throw new Error(
      'Web NFC não é suportado neste navegador. Use o Google Chrome no Android com HTTPS.'
    );
  }

  try {
    const ndef = new (window as any).NDEFReader();
    await ndef.scan({ signal });

    ndef.onreading = (event: any) => {
      const serialNumber = event.serialNumber || '';
      const formattedUid = cleanTagUid(serialNumber);
      onRead({ serialNumber, formattedUid });
    };

    ndef.onreadingerror = () => {
      onError(new Error('Não foi possível ler os dados da tag NFC. Tente aproximar novamente.'));
    };
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    throw err;
  }
}

/**
 * Grava uma URL física na Tag NFC utilizando registro NDEF padrão (recordType: "url")
 */
export async function writeUrlToNfcTag(
  url: string,
  signal?: AbortSignal
): Promise<void> {
  if (!isWebNfcSupported()) {
    throw new Error(
      'Web NFC não é suportado neste navegador. Use o Google Chrome no Android com HTTPS.'
    );
  }

  const ndef = new (window as any).NDEFReader();
  await ndef.write(
    {
      records: [
        {
          recordType: 'url',
          data: url,
        },
      ],
    },
    { signal }
  );
}
