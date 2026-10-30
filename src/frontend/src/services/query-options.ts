import { keepPreviousData, queryOptions } from '@tanstack/react-query';

import { offlineCache, withOfflineFallback } from '@/db/offline-cache';
import type { HistoryPeriod } from '@/interfaces/hospitalization.types';
import type { PendingScheduleQuery } from '@/interfaces/prescription.types';

import { dashboardService } from './dashboard.service';
import { guardianService } from './guardian.service';
import { hospitalizationService } from './hospitalization.service';
import { kennelService } from './kennel.service';
import { patientService, type PatientSearchParams } from './patient.service';
import { prescriptionService } from './prescription.service';

/**
 * Query options factories: each entry pairs a cache key with its request, so the same definition
 * feeds `useQuery`, router loaders (`queryClient.prefetchQuery`) and invalidations (`.all()` prefixes).
 * Bedside data (hospitalized patients, guardians, queue, timeline) falls back to the offline copy without connection.
 */
export const patientQueries = {
  all: () => ['patients'] as const,
  detail: (patientId: string) =>
    queryOptions({
      queryKey: [...patientQueries.all(), 'detail', patientId],
      queryFn: () => withOfflineFallback(() => patientService.getById(patientId), () => offlineCache.getPatient(patientId)),
    }),
  search: (params: PatientSearchParams) =>
    queryOptions({
      queryKey: [...patientQueries.all(), 'search', params],
      queryFn: () => withOfflineFallback(() => patientService.search(params), () => offlineCache.searchPatients(params)),
      // Keeps the previous results on screen while the next search loads, so the list doesn't flash
      placeholderData: keepPreviousData,
    }),
  visits: (period: HistoryPeriod) =>
    queryOptions({
      queryKey: [...patientQueries.all(), 'visits', period],
      queryFn: () => patientService.listVisits(period),
      placeholderData: keepPreviousData,
    }),
  timeline: (patientId: string) =>
    queryOptions({
      queryKey: [...patientQueries.all(), 'timeline', patientId],
      queryFn: () => withOfflineFallback(() => hospitalizationService.getPatientTimeline(patientId), () => offlineCache.getTimeline(patientId)),
    }),
};

export const guardianQueries = {
  all: () => ['guardians'] as const,
  detail: (guardianId: string) =>
    queryOptions({
      queryKey: [...guardianQueries.all(), 'detail', guardianId],
      queryFn: () => withOfflineFallback(() => guardianService.getById(guardianId), () => offlineCache.getGuardian(guardianId)),
    }),
  search: (query: string) =>
    queryOptions({
      queryKey: [...guardianQueries.all(), 'search', query],
      queryFn: () => guardianService.search(query),
      placeholderData: keepPreviousData,
    }),
};

export const scheduleQueries = {
  all: () => ['schedule'] as const,
  pending: (query: PendingScheduleQuery = {}) =>
    queryOptions({
      queryKey: [...scheduleQueries.all(), 'pending', query],
      queryFn: () => withOfflineFallback(() => prescriptionService.getPendingSchedule(query), () => offlineCache.getPendingSchedule(query)),
      // The nursing queue changes during the shift, so it refreshes every minute while on screen
      refetchInterval: 60_000,
    }),
  myRecentEvents: () =>
    queryOptions({ queryKey: [...scheduleQueries.all(), 'my-recent-events'], queryFn: () => hospitalizationService.listMyRecentEvents() }),
};

export const kennelQueries = {
  all: () => ['kennels'] as const,
  list: () => queryOptions({ queryKey: [...kennelQueries.all(), 'list'], queryFn: () => kennelService.list() }),
};

export const dashboardQueries = {
  all: () => ['dashboard'] as const,
  temporalSummary: () =>
    queryOptions({ queryKey: [...dashboardQueries.all(), 'temporal-summary'], queryFn: () => hospitalizationService.getTemporalSummary() }),
  nfcTagUsage: () =>
    queryOptions({ queryKey: [...dashboardQueries.all(), 'nfc-tag-usage'], queryFn: () => dashboardService.getNfcTagUsage() }),
  recentRegistrations: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), 'recent-registrations'],
      queryFn: () => dashboardService.listRecentRegistrations(),
    }),
};
