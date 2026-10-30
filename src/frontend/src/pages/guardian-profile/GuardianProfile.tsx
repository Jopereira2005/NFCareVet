import { useState } from 'react';
import { UserX } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import { PawIcon } from '@/assets/icons/paw-icon';
import { EditGuardianModal, GuardianFinancialCard, GuardianIdentityCard, NewPatientModal, PatientCard } from '@/components/features';
import { PageHeading, SectionHeader } from '@/components/layout';
import { ActionCard, Badge, Button, EmptyState, QueryState } from '@/components/ui';
import { useGuardian } from '@/hooks/queries/useGuardianQueries';
import { ROUTES } from '@/router/paths';
import { formatAge } from '@/utils/formatAge';
import { pluralize } from '@/utils/pluralize';

import styles from './guardian-profile.module.scss';

export default function GuardianProfile() {
  const { guardianId = '' } = useParams();
  const navigate = useNavigate();
  const guardianQuery = useGuardian(guardianId);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isEditingGuardian, setIsEditingGuardian] = useState(false);

  return (
    <>
      <PageHeading title="Perfil do Tutor" subtitle="Dados de cadastro, contatos e pets vinculados ao Tutor" />

      <QueryState
        query={guardianQuery}
        loadingLabel="Carregando tutor…"
        notFound={
          <EmptyState
            icon={UserX}
            title="Tutor não encontrado"
            description={`Não existe tutor cadastrado com o código “${guardianId}”.`}
            action={<Button onClick={() => navigate(ROUTES.search)}>Voltar para a Busca</Button>}
          />
        }
      >
        {(guardian) => {
          const patients = guardian.patients ?? [];

          return (
            <div className={styles['guardian-profile']}>
              <GuardianIdentityCard guardian={guardian} onEdit={() => setIsEditingGuardian(true)} />

              <div className={styles['guardian-profile__actions']}>
                {guardian.financial && (
                  <GuardianFinancialCard status={guardian.financial.status} paymentMethod={guardian.financial.paymentMethod} />
                )}
                <ActionCard title="Vincular Pet" icon={PawIcon} onClick={() => setIsNewPatientOpen(true)} />
              </div>

              <section className={styles['guardian-profile__pets']} aria-labelledby="guardian-pets-title">
                <SectionHeader
                  titleId="guardian-pets-title"
                  title="Pets Vinculados"
                  icon={PawIcon}
                  size="lg"
                  aside={<Badge label={pluralize(patients.length, 'resultado', 'resultados')} tone="dark" mono />}
                />
                {patients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    description={[patient.breed ?? patient.species, patient.birthDate && formatAge(patient.birthDate)].filter(Boolean).join(' • ')}
                  />
                ))}
              </section>

              {isNewPatientOpen && (
                <NewPatientModal guardian={{ id: guardian.id, name: guardian.name }} onClose={() => setIsNewPatientOpen(false)} />
              )}
              {isEditingGuardian && <EditGuardianModal guardian={guardian} onClose={() => setIsEditingGuardian(false)} />}
            </div>
          );
        }}
      </QueryState>
    </>
  );
}
