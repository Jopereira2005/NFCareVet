import { useQuery } from '@tanstack/react-query';

import type { PendingScheduleQuery } from '@/interfaces/prescription.types';
import { scheduleQueries } from '@/services/query-options';

export const usePendingSchedule = (query: PendingScheduleQuery = {}, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({ ...scheduleQueries.pending(query), enabled });

export const useMyRecentClinicalEvents = () => useQuery(scheduleQueries.myRecentEvents());
