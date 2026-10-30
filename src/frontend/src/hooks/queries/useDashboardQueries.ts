import { useQuery } from '@tanstack/react-query';

import { dashboardQueries } from '@/services/query-options';

export const useTemporalSummary = () => useQuery(dashboardQueries.temporalSummary());

export const useNfcTagUsage = () => useQuery(dashboardQueries.nfcTagUsage());

export const useRecentRegistrations = () => useQuery(dashboardQueries.recentRegistrations());
