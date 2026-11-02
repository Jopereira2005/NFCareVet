import { useState } from 'react';
import { UserRole } from '@nfcarevet/common';
import { LogOut, ShieldUser, User } from 'lucide-react';
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

const DEFAULT_AVATARS_BY_EMAIL: Record<string, string> = {
  'admin@nfcarevet.com':
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80',
  'madalena@nfcarevet.com':
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=256&h=256&q=80',
  'paxe@nfcarevet.com':
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&h=256&q=80',
  'rafael@nfcarevet.com':
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80',
  'recepcao@nfcarevet.com':
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'fernanda@nfcarevet.com':
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
};

type HeaderProps = {
  user: CurrentUser;
};

export function Header({ user }: HeaderProps) {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const avatarSrc =
    user.avatarUrl ?? DEFAULT_AVATARS_BY_EMAIL[user.email.toLowerCase()] ?? undefined;

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
            <Avatar
              src={avatarSrc}
              alt=""
              size={32}
              fallback={<User aria-hidden="true" />}
            />
            <span className={styles['header__profile__logout']} aria-hidden="true">
              <LogOut />
            </span>
          </button>
        </div>
      </div>

      {isLogoutOpen && (
        <LogoutModal
          user={{ ...user, avatarUrl: avatarSrc }}
          onClose={() => setIsLogoutOpen(false)}
        />
      )}
    </header>
  );
}
