import { useState } from 'react';
import { UserPlus } from 'lucide-react';

import { PawIcon } from '@/assets/icons/paw-icon';
import { NewGuardianModal, NewPatientModal, RecentRegistrations, ShiftSummaryCard } from '@/components/features';
import { PageHeading, SectionHeader } from '@/components/layout';
import { ActionCard } from '@/components/ui';

import styles from './home.module.scss';

type HomeModal = 'patient' | 'guardian' | null;

export default function Home() {
  const [openModal, setOpenModal] = useState<HomeModal>(null);
  const closeModal = () => setOpenModal(null);

  return (
    <>
      <PageHeading title="Início" subtitle="Visão Geral Clínica & Plantão Ativo" />

      <div className={styles['home']}>
        <ShiftSummaryCard />

        <section className={styles['home__actions']} aria-labelledby="home-actions-title">
          <SectionHeader titleId="home-actions-title" title="Ações Imediatas" size="sm" />
          <div className={styles['home__actions__grid']}>
            <ActionCard variant="primary" title="Novo Paciente" description="Cadastrar pet" icon={PawIcon} onClick={() => setOpenModal('patient')} />
            <ActionCard title="Novo Tutor" description="Vínculo direto" icon={UserPlus} onClick={() => setOpenModal('guardian')} />
          </div>
        </section>

        <RecentRegistrations />
      </div>

      {openModal === 'patient' && <NewPatientModal onClose={closeModal} />}
      {openModal === 'guardian' && <NewGuardianModal onClose={closeModal} />}
    </>
  );
}
