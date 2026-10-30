import { create } from 'zustand';

import type { NfcReaderStatus, NfcReading } from '@/interfaces/nfc.types';

type NfcReadHandler = (reading: NfcReading) => void;

interface NfcState {
  status: NfcReaderStatus;
  error: string | null;
  /** Starts Web NFC scanning; the first call must come from a user gesture (it asks for permission). */
  start: () => Promise<void>;
  stop: () => void;
}

const UNSUPPORTED_MESSAGE = 'Web NFC não é suportado neste navegador. Use o Google Chrome no Android com HTTPS.';

/** USB readers act as keyboards: they "type" the UID and press Enter within a few milliseconds. */
const KEYBOARD_READER_MAX_KEY_INTERVAL_MS = 50;
const KEYBOARD_READER_UID_PATTERN = /^[0-9a-f:]{8,}$/i;

const isWebNfcSupported = () => typeof window !== 'undefined' && 'NDEFReader' in window;

const toNfcReading = (serialNumber: string): NfcReading => ({ serialNumber, uid: serialNumber.replace(/[:\s-]/g, '').toUpperCase() });

// Kept outside the store state: they never drive rendering
const claims: NfcReadHandler[] = [];
let fallbackHandler: NfcReadHandler | null = null;
let abortController: AbortController | null = null;

/**
 * Hands a reading to the screen that claimed the reader most recently (e.g. the Reader page),
 * or to the app-wide fallback (open the patient record) when no screen claimed it.
 */
export const emitNfcReading = (serialNumber: string) => {
  const handler = claims.at(-1) ?? fallbackHandler;
  handler?.(toNfcReading(serialNumber));
};

/** Routes readings to `handler` until the returned release function runs. */
export const claimNfcReader = (handler: NfcReadHandler) => {
  claims.push(handler);

  return () => {
    const index = claims.lastIndexOf(handler);
    if (index >= 0) claims.splice(index, 1);
  };
};

export const setNfcFallbackHandler = (handler: NfcReadHandler | null) => {
  fallbackHandler = handler;
};

export const useNfcStore = create<NfcState>()((set) => ({
  status: isWebNfcSupported() ? 'idle' : 'unsupported',
  error: null,
  start: async () => {
    if (!window.NDEFReader) return set({ status: 'unsupported', error: UNSUPPORTED_MESSAGE });
    // A single scan serves the whole app; starting twice would deliver every tag twice
    if (abortController) return;

    const controller = new AbortController();
    abortController = controller;

    try {
      const reader = new window.NDEFReader();
      reader.onreading = (event) => emitNfcReading(event.serialNumber);
      reader.onreadingerror = () => set({ error: 'Não foi possível ler a tag. Tente aproximar novamente.' });

      await reader.scan({ signal: controller.signal });
      set({ status: 'scanning', error: null });
    } catch (scanError) {
      abortController = null;
      if (scanError instanceof DOMException && scanError.name === 'AbortError') return;

      set({ status: 'error', error: scanError instanceof Error ? scanError.message : 'Não foi possível iniciar o leitor NFC.' });
    }
  },
  stop: () => {
    abortController?.abort();
    abortController = null;
    set((state) => ({ status: state.status === 'unsupported' ? 'unsupported' : 'idle', error: null }));
  },
}));

/** Resumes scanning without a user gesture when the NFC permission was granted in a previous visit. */
export const startNfcIfPermitted = async () => {
  if (!isWebNfcSupported() || !('permissions' in navigator)) return;

  try {
    // 'nfc' is missing from TypeScript's PermissionName union
    const permission = await navigator.permissions.query({ name: 'nfc' as PermissionName });
    if (permission.state === 'granted') await useNfcStore.getState().start();
  } catch {
    // Browsers that don't know the 'nfc' permission throw; the user can still start the reader by tapping
  }
};

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

let keyboardBuffer = '';
let lastKeyAt = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (event) => {
    // Inside a field the reader's output is the user's input (e.g. typing a UID by hand)
    if (isTypingTarget(event.target)) return;

    const now = performance.now();
    if (now - lastKeyAt > KEYBOARD_READER_MAX_KEY_INTERVAL_MS) keyboardBuffer = '';
    lastKeyAt = now;

    if (event.key === 'Enter') {
      const typed = keyboardBuffer;
      keyboardBuffer = '';
      if (KEYBOARD_READER_UID_PATTERN.test(typed)) emitNfcReading(typed);
      return;
    }

    if (event.key.length === 1) keyboardBuffer += event.key;
  });
}
