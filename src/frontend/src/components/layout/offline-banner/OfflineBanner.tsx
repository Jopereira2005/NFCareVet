import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, CloudUpload } from 'lucide-react';

import { offlineDb } from '@/db/offline-database';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { formatRelativeDay } from '@/utils/formatRelativeDay';
import { pluralize } from '@/utils/pluralize';

import styles from './offline-banner.module.scss';

/** Tells the team when screens show the offline copy and how many administrations still wait to be sent. */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const pendingCount = useLiveQuery(() => offlineDb.outbox.count(), [], 0);
  const syncedAt = useLiveQuery(async () => (await offlineDb.meta.get('snapshot'))?.syncedAt, []);

  if (isOnline && pendingCount === 0) return null;

  const pendingLabel = pendingCount > 0 && pluralize(pendingCount, 'administração aguardando envio', 'administrações aguardando envio');
  const copyLabel = syncedAt ? `Cópia dos internados de ${formatRelativeDay(syncedAt)}` : 'Sem cópia offline neste aparelho';

  return (
    <div className={styles['offline-banner']} role="status">
      {isOnline ? <CloudUpload aria-hidden="true" /> : <CloudOff aria-hidden="true" />}
      <p className={styles['offline-banner__text']}>
        <strong>{isOnline ? 'Sincronizando' : 'Sem conexão'}</strong>
        {[!isOnline && copyLabel, pendingLabel].filter(Boolean).join(' • ')}
      </p>
    </div>
  );
}
