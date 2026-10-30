import type { IAuthResponse } from '@nfcarevet/common';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { CurrentUser } from '@/interfaces/session.types';

const STORAGE_KEY = 'nfcarevet:session';

interface SessionState {
  accessToken: string | null;
  user: CurrentUser | null;
  /** "Lembrar de mim": keeps the session after the browser closes (localStorage instead of sessionStorage). */
  remember: boolean;
  signIn: (response: IAuthResponse, remember: boolean) => void;
  signOut: () => void;
}

/**
 * Writes to localStorage when "remember" is on and to sessionStorage otherwise,
 * so an unchecked box ends the session together with the tab.
 */
const sessionStorageSwitch: StateStorage = {
  getItem: (name) => window.localStorage.getItem(name) ?? window.sessionStorage.getItem(name),
  setItem: (name, value) => {
    const remember = (JSON.parse(value) as { state?: { remember?: boolean } }).state?.remember ?? false;
    const [target, other] = remember ? [window.localStorage, window.sessionStorage] : [window.sessionStorage, window.localStorage];
    target.setItem(name, value);
    other.removeItem(name);
  },
  removeItem: (name) => {
    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      remember: false,
      signIn: ({ accessToken, user }, remember) => set({ accessToken, user, remember }),
      signOut: () => set({ accessToken: null, user: null, remember: false }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorageSwitch),
      partialize: ({ accessToken, user, remember }) => ({ accessToken, user, remember }),
    },
  ),
);

/** Read outside React (Axios interceptor, router loaders). */
export const getAccessToken = () => useSessionStore.getState().accessToken;
