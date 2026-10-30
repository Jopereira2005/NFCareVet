import type { IAuthResponse, IBadgeLoginPayload, ILoginPayload } from '@nfcarevet/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clearOfflineData } from '@/db/offline-database';
import { sessionService } from '@/services/session.service';
import { useSessionStore } from '@/stores/useSessionStore';

type LoginVariables = ILoginPayload & { remember: boolean };

/** Stores the session and starts from an empty cache, so no data from a previous user leaks in. */
const useStartSession = () => {
  const queryClient = useQueryClient();
  const signIn = useSessionStore((state) => state.signIn);

  return (response: IAuthResponse, remember: boolean) => {
    queryClient.clear();
    signIn(response, remember);
  };
};

export const useLogin = () => {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: ({ remember: _remember, ...payload }: LoginVariables) => sessionService.login(payload),
    onSuccess: (response, { remember }) => startSession(response, remember),
    // The form shows the error inline
    meta: { silentError: true },
  });
};

export const useBadgeLogin = () => {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: (payload: IBadgeLoginPayload) => sessionService.badgeLogin(payload),
    onSuccess: (response) => startSession(response, true),
    meta: { errorMessage: 'Crachá não reconhecido' },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const signOut = useSessionStore((state) => state.signOut);

  return () => {
    signOut();
    queryClient.clear();
    // Clinical data and guardians' contacts must not stay on a shared device after the shift
    void clearOfflineData();
  };
};
