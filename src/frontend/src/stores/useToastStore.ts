import { create } from 'zustand';

export type ToastTone = 'success' | 'warning';

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastState {
  /** Newest last. Only the newest one is on screen; older ones are dropped when it closes. */
  toasts: ToastMessage[];
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  dismiss: (id: number) => void;
}

const MAX_QUEUED_TOASTS = 3;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  show: (toast) =>
    set((state) => ({ toasts: [...state.toasts, { ...toast, id: Date.now() + Math.random() }].slice(-MAX_QUEUED_TOASTS) })),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Shows a toast from anywhere — components, query callbacks or plain modules. */
export const showToast = (toast: Omit<ToastMessage, 'id'>) => useToastStore.getState().show(toast);
