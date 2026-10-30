import { User } from 'lucide-react';
import { Link } from 'react-router';

import { PawIcon } from '@/assets/icons/paw-icon';
import { Avatar, ContactActions } from '@/components/ui';
import type { Guardian } from '@/interfaces/guardian.types';
import { getGuardianProfilePath } from '@/router/paths';
import { formatShortName } from '@/utils/formatShortName';
import { pluralize } from '@/utils/pluralize';

import styles from './guardian-card.module.scss';

type GuardianCardProps = {
  guardian: Guardian;
};

export function GuardianCard({ guardian }: GuardianCardProps) {
  const { id, name, cpf, createdAt, phone, patients = [], photoUrl } = guardian;
  const shortName = formatShortName(name);

  return (
    <article className={styles['guardian-card']}>
      <header className={styles['guardian-card__header']}>
        <div className={styles['guardian-card__header__identity']}>
          <Avatar src={photoUrl ?? undefined} alt={name} size={44} fallback={<User aria-hidden="true" />} />
          <div className={styles['guardian-card__identity__texts']}>
            <h3 className={styles['guardian-card__texts__name']}>{shortName}</h3>
            <p className={styles['guardian-card__texts__meta']}>
              {cpf && `CPF: ${cpf} • `}Desde {new Date(createdAt).getFullYear()}
            </p>
          </div>
        </div>

        <ContactActions name={shortName} phone={phone} />
      </header>

      <div className={styles['guardian-card__body']}>
        <Link className={styles['guardian-card__body__profile']} to={getGuardianProfilePath(id)} aria-label={`Perfil de ${shortName}`}>
          <User aria-hidden="true" />
          Perfil
        </Link>

        <div className={styles['guardian-card__body__pets']}>
          <div className={styles['guardian-card__pets__header']}>
            <span className={styles['guardian-card__pets__title']}>
              <PawIcon aria-hidden="true" />
              Pets Vinculados
            </span>
            <span className={styles['guardian-card__pets__count']}>{pluralize(patients.length, 'Pet', 'Pets')}</span>
          </div>
          <p className={styles['guardian-card__pets__names']}>{patients.map((patient) => patient.name).join(', ') || 'Nenhum pet vinculado'}</p>
        </div>
      </div>
    </article>
  );
}
