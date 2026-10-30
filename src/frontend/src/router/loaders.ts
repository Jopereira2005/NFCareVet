import { redirect, type LoaderFunctionArgs } from 'react-router';

import { queryClient } from '@/services/query-client';
import { dashboardQueries, guardianQueries, patientQueries, scheduleQueries } from '@/services/query-options';
import { getAccessToken } from '@/stores/useSessionStore';

import { ROUTES } from './paths';

/**
 * Loaders only *start* the requests (prefetch) and return right away: the page renders its
 * own loading state, but the data is already on its way while the page chunk downloads.
 */

export const requireSession = ({ request }: LoaderFunctionArgs) => {
  if (getAccessToken()) return null;

  const { pathname } = new URL(request.url);
  return redirect(`${ROUTES.login}?redirectTo=${encodeURIComponent(pathname)}`);
};

export const redirectIfAuthenticated = () => (getAccessToken() ? redirect(ROUTES.home) : null);

export const homeLoader = () => {
  void queryClient.prefetchQuery(dashboardQueries.temporalSummary());
  void queryClient.prefetchQuery(dashboardQueries.nfcTagUsage());
  void queryClient.prefetchQuery(dashboardQueries.recentRegistrations());
  return null;
};

export const tasksLoader = () => {
  void queryClient.prefetchQuery(scheduleQueries.pending({ onlyMine: true }));
  void queryClient.prefetchQuery(scheduleQueries.myRecentEvents());
  return null;
};

export const patientRecordLoader = ({ params }: LoaderFunctionArgs) => {
  const { patientId = '' } = params;
  void queryClient.prefetchQuery(patientQueries.detail(patientId));
  void queryClient.prefetchQuery(patientQueries.timeline(patientId));
  return null;
};

export const guardianProfileLoader = ({ params }: LoaderFunctionArgs) => {
  void queryClient.prefetchQuery(guardianQueries.detail(params.guardianId ?? ''));
  return null;
};
