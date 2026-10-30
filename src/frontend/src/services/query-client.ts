import { MutationCache, QueryCache, QueryClient, type QueryKey } from '@tanstack/react-query';

import { showToast } from '@/stores/useToastStore';

import { ApiError, isNotFoundError } from './api-error';

interface AppQueryMeta extends Record<string, unknown> {
  /** Message for the toast shown when a background refetch fails. */
  errorMessage?: string;
  /** Skips the global error toast (e.g. polling that the screen already reports). */
  silentError?: boolean;
}

interface AppMutationMeta extends Record<string, unknown> {
  /** Toast shown after the mutation succeeds. */
  successMessage?: string;
  /** Title of the error toast; the API message becomes its description. */
  errorMessage?: string;
  /** Skips the global error toast when the screen handles the error itself. */
  silentError?: boolean;
  /** Queries refetched after success, e.g. `[patientQueries.all()]`. */
  invalidates?: QueryKey[];
}

// Types `meta` and `error` for every useQuery/useMutation in the app
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError;
    queryMeta: AppQueryMeta;
    mutationMeta: AppMutationMeta;
  }
}

const ONE_MINUTE = 60_000;

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // First-load errors are drawn by <QueryState>; only failures of data already on screen need a toast
    onError: (error, query) => {
      if (query.state.data === undefined || query.meta?.silentError) return;
      showToast({ tone: 'warning', title: query.meta?.errorMessage ?? 'Falha ao atualizar os dados', description: error.message });
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: async (_data, _variables, _context, mutation) => {
      const { successMessage, invalidates } = mutation.meta ?? {};
      if (successMessage) showToast({ tone: 'success', title: successMessage });
      if (invalidates) await Promise.all(invalidates.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silentError) return;
      showToast({ tone: 'warning', title: mutation.meta?.errorMessage ?? 'Não foi possível concluir a ação', description: error.message });
    },
  }),
  defaultOptions: {
    queries: {
      // Clinical data changes during the shift, but not every second: 30s avoids refetching on each navigation
      staleTime: 30_000,
      gcTime: 10 * ONE_MINUTE,
      // A 404 or 401 won't succeed on retry; other failures get one more attempt
      retry: (failureCount, error) => !isNotFoundError(error) && error.status !== 401 && failureCount < 1,
      refetchOnWindowFocus: true,
      // Requests run even offline: the bedside queries answer from the Dexie copy instead of pausing
      networkMode: 'always',
    },
    mutations: {
      retry: false,
      // Lets an administration made offline reach the outbox instead of waiting paused
      networkMode: 'always',
    },
  },
});
