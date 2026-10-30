import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);

  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
};

/** Whether the browser reports a network connection; re-renders when it drops or returns. */
export const useOnlineStatus = () => useSyncExternalStore(subscribe, () => navigator.onLine);
