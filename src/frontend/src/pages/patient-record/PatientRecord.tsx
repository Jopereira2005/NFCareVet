import { useState } from 'react';
import { UserRole } from '@nfcarevet/common';
import { ClipboardClock, FileX, History, Plus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

import {
  AdministerTaskModal,
  AdmitPatientModal,
  ClinicalEventCard,
  ClinicalEventModal,
  DischargeModal,
  EditPatientModal,
  HospitalizationPanel,
  PatientRecordHeader,
  ScheduleTaskCard,
  TaskModal,
  TransferKennelModal,
} from '@/components/features';
import { PageHeading, SectionHeader } from '@/components/layout';
import { Badge, Button, EmptyState, FloatingActionButton, QueryState } from '@/components/ui';
import { usePatient, usePatientTimeline } from '@/hooks/queries/usePatientQueries';
import { usePendingSchedule } from '@/hooks/queries/useTaskQueries';
import type { TimelineEvent } from '@/interfaces/clinical-event.types';
import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { ROUTES } from '@/router/paths';
import { useSessionStore } from '@/stores/useSessionStore';
import { showToast } from '@/stores/useToastStore';
import { pluralize } from '@/utils/pluralize';

import styles from './patient-record.module.scss';

export default function PatientRecord() {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();

  // Patient and timeline only need the URL param, so both requests start in parallel
  const patientQuery = usePatient(patientId);
  const timelineQuery = usePatientTimeline(patientId);
  const hospitalizationId = patientQuery.data?.activeHospitalization?.id;
  const scheduleQuery = usePendingSchedule({ hospitalizationId }, { enabled: Boolean(hospitalizationId) });
  const pendingItems = hospitalizationId ? scheduleQuery.data : [];
  const [taskModal, setTaskModal] = useState<{ mode: 'create' } | { mode: 'edit'; entry: PendingScheduleItem } | null>(null);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [administeringTask, setAdministeringTask] = useState<PendingScheduleItem | null>(null);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [hospitalizationModal, setHospitalizationModal] = useState<'admit' | 'transfer' | 'discharge' | null>(null);
  const canManageHospitalization = useSessionStore((state) => state.user?.role !== UserRole.REC);

  // Tasks hang on a hospitalization, so a patient without one can't receive new tasks
  const openNewTask = () => {
    if (hospitalizationId) return setTaskModal({ mode: 'create' });
    if (canManageHospitalization) return setHospitalizationModal('admit');
    showToast({ tone: 'warning', title: 'Paciente sem internação ativa', description: 'Peça a um veterinário para internar o paciente.' });
  };

  return (
    <>
      <PageHeading title="Prontuário do Paciente" subtitle="Acompanhamento clínico e histórico veterinário" />

      <QueryState
        query={patientQuery}
        loadingLabel="Carregando prontuário…"
        notFound={
          <EmptyState
            icon={FileX}
            title="Paciente não encontrado"
            description={`Não existe prontuário para o código “${patientId}”.`}
            action={<Button onClick={() => navigate(ROUTES.search)}>Buscar paciente</Button>}
          />
        }
      >
        {(patient) => (
          <div className={styles['patient-record']}>
            <PatientRecordHeader patient={patient} onEdit={() => setIsEditingPatient(true)} />

            <HospitalizationPanel
              hospitalization={patient.activeHospitalization}
              canManage={canManageHospitalization}
              onAdmit={() => setHospitalizationModal('admit')}
              onTransfer={() => setHospitalizationModal('transfer')}
              onDischarge={() => setHospitalizationModal('discharge')}
            />

            <section className={styles['patient-record__section']} aria-labelledby="record-pending-title">
              <SectionHeader
                titleId="record-pending-title"
                title="Ações Pendentes"
                icon={ClipboardClock}
                size="lg"
                aside={pendingItems && <Badge label={pluralize(pendingItems.length, 'pendente', 'pendentes')} tone="danger" mono />}
              />
              {!pendingItems && scheduleQuery.isPending && <p className={styles['patient-record__section__empty']}>Carregando…</p>}
              {pendingItems?.length === 0 && (
                <p className={styles['patient-record__section__empty']}>
                  {hospitalizationId ? 'Nenhuma ação pendente.' : 'Paciente sem internação ativa.'}
                </p>
              )}
              {pendingItems?.map((entry) => (
                <ScheduleTaskCard
                  key={entry.item.id}
                  entry={entry}
                  onEdit={() => setTaskModal({ mode: 'edit', entry })}
                  onAdminister={() => setAdministeringTask(entry)}
                />
              ))}
            </section>

            <section className={styles['patient-record__section']} aria-labelledby="record-history-title">
              <SectionHeader
                titleId="record-history-title"
                title="Histórico Recente"
                icon={History}
                size="lg"
                action={{ label: 'Ver Histórico', to: ROUTES.history }}
              />
              <QueryState query={timelineQuery} loadingLabel="Carregando histórico…">
                {({ items }) =>
                  items.length === 0 ? (
                    <p className={styles['patient-record__section__empty']}>Nenhum registro recente.</p>
                  ) : (
                    items.map((event) => (
                      <ClinicalEventCard key={event.id} event={event} showPatient={false} onEdit={() => setEditingEvent(event)} />
                    ))
                  )
                }
              </QueryState>
            </section>
          </div>
        )}
      </QueryState>

      <FloatingActionButton label="Nova Ação" icon={Plus} onClick={openNewTask} />

      {taskModal?.mode === 'create' && hospitalizationId && patientQuery.data && (
        <TaskModal mode="create" patient={{ name: patientQuery.data.name, hospitalizationId }} onClose={() => setTaskModal(null)} />
      )}
      {taskModal?.mode === 'edit' && <TaskModal mode="edit" entry={taskModal.entry} onClose={() => setTaskModal(null)} />}
      {isEditingPatient && patientQuery.data && <EditPatientModal patient={patientQuery.data} onClose={() => setIsEditingPatient(false)} />}
      {editingEvent && <ClinicalEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />}
      {administeringTask && <AdministerTaskModal entry={administeringTask} onClose={() => setAdministeringTask(null)} />}
      {hospitalizationModal === 'admit' && patientQuery.data && (
        <AdmitPatientModal patient={patientQuery.data} onClose={() => setHospitalizationModal(null)} />
      )}
      {hospitalizationModal === 'transfer' && patientQuery.data?.activeHospitalization && (
        <TransferKennelModal
          patientName={patientQuery.data.name}
          hospitalization={patientQuery.data.activeHospitalization}
          onClose={() => setHospitalizationModal(null)}
        />
      )}
      {hospitalizationModal === 'discharge' && patientQuery.data?.activeHospitalization && (
        <DischargeModal
          patientName={patientQuery.data.name}
          hospitalization={patientQuery.data.activeHospitalization}
          pendingTaskCount={pendingItems?.length ?? 0}
          onClose={() => setHospitalizationModal(null)}
        />
      )}
    </>
  );
}
