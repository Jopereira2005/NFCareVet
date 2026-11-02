import { UserRole } from '@nfcarevet/common';
import { redirect, type LoaderFunctionArgs } from 'react-router';

import { isForbiddenError, isNotFoundError, isUnauthorizedError } from '@/services/api-error';
import { patientService } from '@/services/patient.service';
import { queryClient } from '@/services/query-client';
import { dashboardQueries, guardianQueries, patientQueries, scheduleQueries } from '@/services/query-options';
import { getAccessToken, useSessionStore } from '@/stores/useSessionStore';
import { showToast } from '@/stores/useToastStore';

import { getBedsidePath, getPatientRecordPath, ROUTES } from './paths';

/**
 * Loaders only *start* the requests (prefetch) and return right away: the page renders its
 * own loading state, but the data is already on its way while the page chunk downloads.
 */

export const requireSession = ({ request }: LoaderFunctionArgs) => {
  if (getAccessToken()) return null;

  const { pathname } = new URL(request.url);
  return redirect(`${ROUTES.login}?redirectTo=${encodeURIComponent(pathname)}`);
};

export const requireAdmin = () => {
  const user = useSessionStore.getState().user;
  if (user?.role === UserRole.ADMIN) return null;

  showToast({
    tone: 'warning',
    title: 'Acesso restrito',
    description: 'Apenas administradores podem acessar o gerenciamento de tags NFC.',
  });
  return redirect(ROUTES.home);
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

/** Resolves a tag URL (/bedside/:identifier) written onto an NFC collar and redirects to the patient's record. */
export const bedsideLoader = async ({ params }: LoaderFunctionArgs) => {
  const identifier = params.identifier ?? '';
  if (!identifier) return redirect(ROUTES.reader);

  if (!getAccessToken()) {
    showToast({
      tone: 'warning',
      title: 'Autenticação necessária',
      description: 'Faça login para acessar o prontuário deste paciente.',
    });
    return redirect(`${ROUTES.login}?redirectTo=${encodeURIComponent(getBedsidePath(identifier))}`);
  }

  try {
    const patient = await patientService.getByTagUid(identifier);
    queryClient.setQueryData(patientQueries.detail(patient.id).queryKey, patient);
    showToast({
      tone: 'success',
      title: 'Coleira NFC Identificada',
      description: `Abrindo prontuário de ${patient.name}`,
    });
    return redirect(getPatientRecordPath(patient.id));
  } catch (error) {
    if (isUnauthorizedError(error)) {
      showToast({
        tone: 'warning',
        title: 'Autenticação necessária',
        description: 'Faça login para acessar o prontuário deste paciente.',
      });
      return redirect(`${ROUTES.login}?redirectTo=${encodeURIComponent(getBedsidePath(identifier))}`);
    }

    if (isForbiddenError(error)) {
      showToast({
        tone: 'warning',
        title: 'Acesso restrito',
        description: 'Seu perfil de usuário não tem permissão para acessar este prontuário.',
      });
      return redirect(ROUTES.home);
    }

    if (isNotFoundError(error)) {
      showToast({
        tone: 'warning',
        title: 'Tag sem internação ativa',
        description: `Identificador ${identifier} não está vinculado a um paciente internado.`,
      });
      return redirect(`${ROUTES.reader}?mode=link`);
    }

    showToast({
      tone: 'warning',
      title: 'Falha ao identificar tag',
      description: error instanceof Error ? error.message : 'Não foi possível carregar os dados da coleira.',
    });
    return redirect(ROUTES.reader);
  }
};
