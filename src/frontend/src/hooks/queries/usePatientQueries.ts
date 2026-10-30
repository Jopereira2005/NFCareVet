import { useMutation, useQuery } from '@tanstack/react-query';

import { offlineCache, withOfflineFallback } from '@/db/offline-cache';
import type { HistoryPeriod } from '@/interfaces/hospitalization.types';
import { patientService, type PatientSearchParams } from '@/services/patient.service';
import { patientQueries } from '@/services/query-options';

export const usePatient = (patientId: string) => useQuery(patientQueries.detail(patientId));

export const usePatientSearch = (params: PatientSearchParams) => useQuery(patientQueries.search(params));

export const usePatientVisits = (period: HistoryPeriod) => useQuery(patientQueries.visits(period));

export const usePatientTimeline = (patientId: string) => useQuery(patientQueries.timeline(patientId));

/** NFC reads are user actions, so the lookup is a mutation; the reader screen shows its own feedback. */
export const useResolveNfcTag = () =>
  useMutation({
    mutationFn: (tagUid: string) => withOfflineFallback(() => patientService.getByTagUid(tagUid), () => offlineCache.getPatientByTagUid(tagUid)),
    meta: { silentError: true },
  });
