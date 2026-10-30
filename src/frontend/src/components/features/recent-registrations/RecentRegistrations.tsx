import { BadgeCheck, CircleCheck, Clock, IdCard, Nfc, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router';

import { PawIcon } from '@/assets/icons/paw-icon';
import { SectionHeader } from '@/components/layout';
import { Avatar, QueryState } from '@/components/ui';
import { useRecentRegistrations } from '@/hooks/queries/useDashboardQueries';
import type { Guardian } from '@/interfaces/guardian.types';
import type { Patient } from '@/interfaces/patient.types';
import { getGuardianProfilePath, getPatientRecordPath, ROUTES } from '@/router/paths';
import { formatNameList } from '@/utils/formatNameList';
import { formatRelativeDay } from '@/utils/formatRelativeDay';
import { formatShortName } from '@/utils/formatShortName';
import { maskCpf } from '@/utils/maskCpf';
import { pluralize } from '@/utils/pluralize';

import { RegistrationCard } from '../registration-card/RegistrationCard';

import styles from './recent-registrations.module.scss';

function PatientRegistration({ patient }: { patient: Patient }) {
  const navigate = useNavigate();

  return (
    <RegistrationCard
      title={patient.name}
      badgeLabel="Pet Cadastrado"
      description={`${patient.breed ?? patient.species} · Tutor(a):`}
      descriptionHighlight={patient.guardian ? formatShortName(patient.guardian.name) : '—'}
      avatar={
        <Avatar
          src={patient.photoUrl ?? undefined}
          alt={`Foto de ${patient.name}`}
          size={56}
          shape="rounded"
          fallback={<PawIcon aria-hidden="true" />}
          badge={{ tone: 'secondary', content: '🐾' }}
        />
      }
      identifier={{ icon: Nfc, label: patient.nfcTag ? `#${patient.nfcTag.publicCode}` : 'Sem tag' }}
      status={{
        icon: BadgeCheck,
        label: patient.nfcTag?.active ? 'Tag Ativa' : 'Tag Inativa',
        tone: patient.nfcTag?.active ? 'highlight' : 'muted',
      }}
      timestamp={{ icon: CircleCheck, label: `Cadastrado ${formatRelativeDay(patient.createdAt)}` }}
      actionLabel="Ver Ficha"
      onAction={() => navigate(getPatientRecordPath(patient.id))}
    />
  );
}

function GuardianRegistration({ guardian }: { guardian: Guardian }) {
  const navigate = useNavigate();
  const patientNames = (guardian.patients ?? []).map(({ name }) => name);

  return (
    <RegistrationCard
      title={formatShortName(guardian.name)}
      badgeLabel="Tutor Cadastrado"
      description={`Tutor(a) · ${pluralize(patientNames.length, 'pet', 'pets')}:`}
      descriptionHighlight={formatNameList(patientNames) || '—'}
      avatar={
        <Avatar alt={guardian.name} size={56} shape="rounded" fallback={<User aria-hidden="true" />} badge={{ tone: 'dark', content: '👤' }} />
      }
      identifier={{ icon: IdCard, label: guardian.cpf ? `CPF: ${maskCpf(guardian.cpf)}` : 'CPF não informado' }}
      status={{ icon: ShieldCheck, label: guardian.cpf ? 'Verificado' : 'Pendente', tone: 'muted' }}
      timestamp={{ icon: Clock, label: `Cadastrado ${formatRelativeDay(guardian.createdAt)}`, tone: 'muted' }}
      actionLabel="Ver Perfil"
      onAction={() => navigate(getGuardianProfilePath(guardian.id))}
    />
  );
}

/** "Últimos Cadastrados" section of the home screen. */
export function RecentRegistrations() {
  const registrationsQuery = useRecentRegistrations();

  return (
    <section className={styles['recent-registrations']} aria-labelledby="recent-registrations-title">
      <SectionHeader
        titleId="recent-registrations-title"
        title="Últimos Cadastrados"
        subtitle="Pets e tutores adicionados recentemente"
        action={{ label: 'Ver todos', to: ROUTES.search }}
      />
      <QueryState query={registrationsQuery} loadingLabel="Carregando cadastros…">
        {(registrations) => (
          <div className={styles['recent-registrations__list']}>
            {registrations.map((registration) =>
              registration.kind === 'patient' ? (
                <PatientRegistration key={registration.patient.id} patient={registration.patient} />
              ) : (
                <GuardianRegistration key={registration.guardian.id} guardian={registration.guardian} />
              ),
            )}
          </div>
        )}
      </QueryState>
    </section>
  );
}
