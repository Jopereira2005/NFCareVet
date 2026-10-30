import { useQuery } from '@tanstack/react-query';

import { guardianQueries } from '@/services/query-options';

export const useGuardian = (guardianId: string) => useQuery(guardianQueries.detail(guardianId));

export const useGuardianSearch = (query: string) => useQuery(guardianQueries.search(query));
