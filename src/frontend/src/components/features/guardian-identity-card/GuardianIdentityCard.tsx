import { Mail, MapPin, PenLine, Phone, User } from 'lucide-react';

import { Avatar, ContactActions, IconButton, SectionLabel, StatusPill } from '@/components/ui';
import type { Guardian } from '@/interfaces/guardian.types';
import { formatMonthYear } from '@/utils/formatMonthYear';

import styles from './guardian-identity-card.module.scss';

type GuardianIdentityCardProps = {
  guardian: Guardian;
  onEdit?: () => void;
};

export function GuardianIdentityCard({ guardian, onEdit }: GuardianIdentityCardProps) {
  const { name, cpf, createdAt, phone, email, address, photoUrl, isActive } = guardian;

  return (
    <section className={styles['guardian-identity-card']} aria-label="Dados do tutor">
      <header className={styles['guardian-identity-card__header']}>
        <Avatar src={photoUrl ?? undefined} alt={name} size={80} shape="rounded" fallback={<User aria-hidden="true" />} />

        <div className={styles['guardian-identity-card__header__info']}>
          <div className={styles['guardian-identity-card__info__meta']}>
            {isActive && <StatusPill label="TUTOR ATIVO" tone="success" />}
            <span className={styles['guardian-identity-card__meta__since']}>Desde {formatMonthYear(createdAt)}</span>
          </div>
          <h2 className={styles['guardian-identity-card__info__name']}>{name}</h2>
          {cpf && (
            <p className={styles['guardian-identity-card__info__document']}>
              CPF: <strong>{cpf}</strong>
            </p>
          )}
        </div>

        {onEdit && <IconButton className={styles['guardian-identity-card__header__edit']} icon={PenLine} label="Editar dados do tutor" onClick={onEdit} />}
      </header>

      <div className={styles['guardian-identity-card__group']}>
        <SectionLabel label="Contatos" />
        <div className={styles['guardian-identity-card__group__box']}>
          <ul className={styles['guardian-identity-card__box__list']}>
            <li>
              <Phone aria-hidden="true" />
              <a href={`tel:${phone.replace(/\D/g, '')}`}>{phone}</a>
            </li>
            {email && (
              <li>
                <Mail aria-hidden="true" />
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
          </ul>
          <ContactActions name={name} phone={phone} size={28} />
        </div>
      </div>

      {address && (
        <div className={styles['guardian-identity-card__group']}>
          <SectionLabel label="Endereço" />
          <div className={styles['guardian-identity-card__group__box']}>
            <p className={styles['guardian-identity-card__box__address']}>
              <MapPin aria-hidden="true" />
              {address}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
