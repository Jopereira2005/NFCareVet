import { TriangleAlert } from 'lucide-react';
import { useNavigate, useRouteError } from 'react-router';

import { Button } from '@/components/ui/button/Button';
import { EmptyState } from '@/components/ui/empty-state/EmptyState';
import { ROUTES } from '@/router/paths';

/** Router `errorElement`: catches render errors of a page and keeps the app shell usable. */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={TriangleAlert}
      title="Algo deu errado nesta tela"
      description={error instanceof Error ? error.message : 'Tente novamente em instantes.'}
      action={<Button onClick={() => navigate(ROUTES.home)}>Voltar ao início</Button>}
    />
  );
}
