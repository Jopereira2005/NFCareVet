import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { CloudOff } from 'lucide-react';

import { isNotFoundError } from '@/services/api-error';

import { Button } from '../button/Button';
import { EmptyState } from '../empty-state/EmptyState';
import { LoadingState } from '../loading-state/LoadingState';

type QueryStateProps<TData> = {
  query: Pick<UseQueryResult<TData>, 'data' | 'error' | 'isPending' | 'isError' | 'refetch'>;
  children: (data: TData) => ReactNode;
  loadingLabel?: string;
  /** Rendered instead of the generic error when the API answers 404. */
  notFound?: ReactNode;
  errorTitle?: string;
};

/** Renders the loading, error and not-found states of a query, and `children` once data is available. */
export function QueryState<TData>({
  query,
  children,
  loadingLabel,
  notFound,
  errorTitle = 'Não foi possível carregar os dados',
}: QueryStateProps<TData>) {
  if (query.isPending) return <LoadingState label={loadingLabel} />;

  if (query.isError) {
    if (notFound && isNotFoundError(query.error)) return notFound;

    return (
      <EmptyState
        icon={CloudOff}
        title={errorTitle}
        description={query.error?.message}
        action={<Button onClick={() => void query.refetch()}>Tentar novamente</Button>}
      />
    );
  }

  return children(query.data as TData);
}
