import clsx from 'clsx';
import { BadgeCheck, Ban, Droplet, Info, Mars, Nfc, PenLine, Pill, User, Venus, Weight } from 'lucide-react';
import { Link } from 'react-router';

import { PawIcon } from '@/assets/icons/paw-icon';
import { Avatar, Badge, ContactActions, IconButton, SectionLabel, TagInfo } from '@/components/ui';
import type { IconComponent } from '@/interfaces/icon.types';
import type { Patient } from '@/interfaces/patient.types';
import { getGuardianProfilePath } from '@/router/paths';
import { formatAge } from '@/utils/formatAge';
import { formatShortName } from '@/utils/formatShortName';
import { getPatientObservations, type ObservationType } from '@/utils/getPatientObservations';
import { getPatientStatusBadge } from '@/utils/getPatientStatusBadge';

import styles from './patient-record-header.module.scss';

const OBSERVATION_ICON: Record<ObservationType, IconComponent> = {
  allergy: Ban,
  treatment: Pill,
  behavior: Info,
};

const weightFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

type PatientRecordHeaderProps = {
  patient: Patient;
  onEdit?: () => void;
};

export function PatientRecordHeader({ patient, onEdit }: PatientRecordHeaderProps) {
  const { name, breed, species, sex, birthDate, weightKg, bloodType, photoUrl, nfcTag, guardian } = patient;
  const statusBadge = getPatientStatusBadge(patient);
  const observations = getPatientObservations(patient);
  const SexIcon = sex === 'FEMALE' ? Venus : Mars;
  const subtitle = [breed ?? species, birthDate && formatAge(birthDate)].filter(Boolean).join(' • ');

  return (
    <section className={styles['patient-record-header']} aria-label={`Dados de ${name}`}>
      <header className={styles['patient-record-header__identity']}>
        <div className={styles['patient-record-header__identity__photo']}>
          <Avatar src={photoUrl ?? undefined} alt={`Foto de ${name}`} size={80} shape="rounded" fallback={<PawIcon aria-hidden="true" />} />
          {sex && (
            <span className={styles['patient-record-header__photo__sex']}>
              <SexIcon aria-hidden="true" />
              {sex === 'FEMALE' ? 'Fêmea' : 'Macho'}
            </span>
          )}
        </div>

        <div className={styles['patient-record-header__identity__info']}>
          <div className={styles['patient-record-header__info__title']}>
            <h2 className={styles['patient-record-header__title__name']}>{name}</h2>
            {statusBadge && <Badge label={statusBadge.label} tone={statusBadge.tone} />}
          </div>
          <p className={styles['patient-record-header__info__breed']}>{subtitle}</p>
          {(weightKg || bloodType) && (
            <div className={styles['patient-record-header__info__metrics']}>
              {weightKg && (
                <span className={styles['patient-record-header__metrics__item']}>
                  <Weight aria-hidden="true" />
                  {weightFormatter.format(Number(weightKg))} kg
                </span>
              )}
              {bloodType && (
                <span className={clsx(styles['patient-record-header__metrics__item'], styles['patient-record-header__metrics__item--blood'])}>
                  <Droplet aria-hidden="true" />
                  {bloodType}
                </span>
              )}
            </div>
          )}
        </div>

        {onEdit && <IconButton className={styles['patient-record-header__identity__edit']} icon={PenLine} label={`Editar dados de ${name}`} onClick={onEdit} />}
      </header>

      {nfcTag && (
        <TagInfo
          identifier={{ icon: Nfc, label: `#${nfcTag.publicCode}` }}
          status={{ icon: BadgeCheck, label: nfcTag.active ? 'Tag Ativa' : 'Tag Inativa', tone: nfcTag.active ? 'highlight' : 'muted' }}
        />
      )}

      {guardian && (
        <div className={styles['patient-record-header__guardian']}>
          <Link className={styles['patient-record-header__guardian__identity']} to={getGuardianProfilePath(guardian.id)}>
            <Avatar alt={guardian.name} size={36} fallback={<User aria-hidden="true" />} />
            <span className={styles['patient-record-header__guardian__texts']}>
              <span className={styles['patient-record-header__texts__label']}>Tutor(a) Responsável</span>
              <span className={styles['patient-record-header__texts__name']}>{formatShortName(guardian.name)}</span>
            </span>
          </Link>
          <ContactActions name={guardian.name} phone={guardian.phone} size={36} />
        </div>
      )}

      <div className={styles['patient-record-header__observations']}>
        <SectionLabel label="Observações" />
        {observations.length > 0 ? (
          <ul className={styles['patient-record-header__observations__list']}>
            {observations.map(({ type, label }) => {
              const Icon = OBSERVATION_ICON[type];

              return (
                <li key={`${type}-${label}`} className={clsx(styles['patient-record-header__list__item'], styles[`patient-record-header__list__item--${type}`])}>
                  <Icon aria-hidden="true" />
                  {label}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles['patient-record-header__observations__empty']}>Nenhuma observação registrada.</p>
        )}
      </div>
    </section>
  );
}
