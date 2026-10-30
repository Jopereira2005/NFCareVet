import { MapPinOff } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button, EmptyState } from '@/components/ui';
import { ROUTES } from '@/router/paths';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={MapPinOff}
      title="Página não encontrada"
      description="O endereço acessado não existe ou foi movido."
      action={<Button onClick={() => navigate(ROUTES.home)}>Voltar ao início</Button>}
    />
  );
}
