import { useLiveQuery } from 'dexie-react-hooks';
import { TriangleAlert } from 'lucide-react';

import { Avatar, Button, Modal } from '@/components/ui';
import { offlineDb } from '@/db/offline-database';
import { useLogout } from '@/hooks/queries/useSessionMutations';
import type { CurrentUser } from '@/interfaces/session.types';
import { pluralize } from '@/utils/pluralize';

import styles from './logout-modal.module.scss';

type LogoutModalProps = {
  user: CurrentUser;
  onClose: () => void;
};

/** Shared devices change hands during shifts, so leaving the account is always confirmed. */
export function LogoutModal({ user, onClose }: LogoutModalProps) {
  const logout = useLogout();
  const pendingCount = useLiveQuery(() => offlineDb.outbox.count(), [], 0);

  return (
    <Modal
      title="Sair da conta?"
      description="Você precisará entrar novamente (com senha ou crachá) para acessar os prontuários. A cópia offline dos internados é apagada deste aparelho."
      onClose={onClose}
      footer={
        <>
          <Button variant="outlined" onClick={onClose}>
            Continuar conectado
          </Button>
          <Button variant="danger" onClick={logout}>
            {pendingCount > 0 ? 'Sair e descartar' : 'Sair'}
          </Button>
        </>
      }
    >
      <div className={styles['logout-modal__user']}>
        <Avatar src={user.avatarUrl ?? undefined} alt="" size={40} />
        <span className={styles['logout-modal__user__texts']}>
          <span className={styles['logout-modal__texts__name']}>{user.name}</span>
          <span className={styles['logout-modal__texts__email']}>{user.email}</span>
        </span>
      </div>

      {pendingCount > 0 && (
        <p className={styles['logout-modal__warning']} role="alert">
          <TriangleAlert aria-hidden="true" />
          {pluralize(pendingCount, 'administração feita offline ainda não foi enviada', 'administrações feitas offline ainda não foram enviadas')}. Reconecte o
          aparelho antes de sair, ou elas serão perdidas.
        </p>
      )}
    </Modal>
  );
}
