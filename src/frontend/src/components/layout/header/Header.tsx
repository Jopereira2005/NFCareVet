import { useState } from 'react';
import { UserRole } from '@nfcarevet/common';
import { LogOut, ShieldUser } from 'lucide-react';
import { Link } from 'react-router';

import { Logo } from '@/assets/Logo.tsx';
import { LogoutModal } from '@/components/features/logout-modal/LogoutModal';
import { NfcStatusIndicator } from '@/components/features/nfc-status-indicator/NfcStatusIndicator';
import { Avatar } from '@/components/ui/avatar/Avatar';
import type { CurrentUser } from '@/interfaces/session.types';
import { ROUTES } from '@/router/paths';

import styles from './header.module.scss';

const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Admin',
  [UserRole.VET]: 'Veterinário',
  [UserRole.REC]: 'Recepção',
};

type HeaderProps = {
  user: CurrentUser;
};

export function Header({ user }: HeaderProps) {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <header className={styles['header']}>
      <div className={styles['header__container']}>
        <Link className={styles['header__container__brand']} to={ROUTES.home} aria-label="NFCareVet — Início">
          <Logo className={styles['header__brand__logo']} aria-hidden="true" />
          <span className={styles['header__brand__name']}>
            <span className={styles['header__name__primary']}>NFC</span>
            <span className={styles['header__name__neutral']}>are</span>
            <span className={styles['header__name__accent']}>Vet</span>
          </span>
        </Link>

        <div className={styles['header__container__actions']}>
          <NfcStatusIndicator />
          <span className={styles['header__actions__role']}>
            <ShieldUser aria-hidden="true" />
            <span className={styles['header__role__label']}>{ROLE_LABEL[user.role]}</span>
          </span>
          <button
            type="button"
            className={styles['header__actions__profile']}
            aria-label={`Sair da conta de ${user.name}`}
            title="Sair da conta"
            onClick={() => setIsLogoutOpen(true)}
          >
            <Avatar src={user.avatarUrl ?? undefined} alt="" size={32} />
            <span className={styles['header__profile__logout']} aria-hidden="true">
              <LogOut />
            </span>
          </button>
        </div>
      </div>

      {isLogoutOpen && <LogoutModal user={user} onClose={() => setIsLogoutOpen(false)} />}
    </header>
  );
}
