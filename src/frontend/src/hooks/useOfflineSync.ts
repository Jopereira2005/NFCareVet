import { useEffect } from 'react';

import { syncHospitalizedSnapshot } from '@/db/offline-sync';
import { flushTaskOutbox } from '@/db/task-outbox';
import { queryClient } from '@/services/query-client';
import { patientQueries, scheduleQueries } from '@/services/query-options';
import { showToast } from '@/stores/useToastStore';
import { pluralize } from '@/utils/pluralize';

const SYNC_INTERVAL_MS = 5 * 60_000;

let runningSync: Promise<void> | null = null;

/** Sends what was done offline, then refreshes the copy; overlapping triggers share the same run. */
const runSync = (userId: string) => {
  runningSync ??= (async () => {
    try {
      const { sent, rejected } = await flushTaskOutbox();

      if (sent > 0) {
        showToast({ tone: 'success', title: pluralize(sent, 'administração enviada', 'administrações enviadas'), description: 'Registros feitos offline sincronizados.' });
        await Promise.all([queryClient.invalidateQueries({ queryKey: scheduleQueries.all() }), queryClient.invalidateQueries({ queryKey: patientQueries.all() })]);
      }
      for (const { taskTitle, patientName, lastError } of rejected) {
        showToast({ tone: 'warning', title: `Administração não registrada: ${taskTitle} (${patientName})`, description: lastError });
      }

      await syncHospitalizedSnapshot(userId);
    } catch {
      // A failed refresh keeps the previous copy; the next trigger tries again
    } finally {
      runningSync = null;
    }
  })();

  return runningSync;
};

/**
 * Keeps the offline copy of the hospitalized patients current while the app is open:
 * on login, when the connection returns, when the app comes back to the foreground and every few minutes.
 */
export function useOfflineSync(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const syncWhenOnline = () => {
      if (navigator.onLine) void runSync(userId);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === 'visible') syncWhenOnline();
    };

    syncWhenOnline();
    const intervalId = window.setInterval(syncWhenOnline, SYNC_INTERVAL_MS);
    window.addEventListener('online', syncWhenOnline);
    document.addEventListener('visibilitychange', syncWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('online', syncWhenOnline);
      document.removeEventListener('visibilitychange', syncWhenVisible);
    };
  }, [userId]);
}
