import { offlineSnapshotService } from '@/services/offline-snapshot.service';

import { clearOfflineData, offlineDb, SNAPSHOT_TABLES } from './offline-database';

/**
 * Replaces the offline copy with the current hospitalized patients. Discharged patients disappear with it,
 * and tasks still waiting in the outbox stay out of the queue, as they were already administered here.
 */
export async function syncHospitalizedSnapshot(userId: string) {
  const meta = await offlineDb.meta.get('snapshot');
  // Another professional signed in on this device: their predecessor's data and pending sends must not carry over
  if (meta && meta.userId !== userId) await clearOfflineData();

  const snapshot = await offlineSnapshotService.getHospitalizedSnapshot();
  const queuedApplications = await offlineDb.outbox.toArray();
  const queuedItemIds = new Set(queuedApplications.map(({ itemId }) => itemId));

  await offlineDb.transaction('rw', SNAPSHOT_TABLES, async () => {
    await Promise.all(SNAPSHOT_TABLES.map((table) => table.clear()));
    await offlineDb.patients.bulkPut(snapshot.patients);
    await offlineDb.guardians.bulkPut(snapshot.guardians);
    await offlineDb.schedule.bulkPut(snapshot.schedule.filter(({ item }) => !queuedItemIds.has(item.id)));
    await offlineDb.timelines.bulkPut(snapshot.timelines);
    await offlineDb.meta.put({ key: 'snapshot', syncedAt: new Date().toISOString(), userId });
  });
}
