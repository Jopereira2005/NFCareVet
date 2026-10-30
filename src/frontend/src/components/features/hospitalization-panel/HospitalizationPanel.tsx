import { ArrowRightLeft, BedDouble, CalendarClock, ClipboardPlus, LogOut, Stethoscope } from 'lucide-react';

import { Button, StatusPill } from '@/components/ui';
import type { PatientActiveHospitalization } from '@/interfaces/patient.types';
import { formatRelativeDay } from '@/utils/formatRelativeDay';

import styles from './hospitalization-panel.module.scss';

type HospitalizationPanelProps = {
  hospitalization?: PatientActiveHospitalization | null;
  /** Admitting, transferring and discharging are restricted to ADMIN and VET by the API. */
  canManage: boolean;
  onAdmit: () => void;
  onTransfer: () => void;
  onDischarge: () => void;
};

/** Current hospitalization of the patient and the actions that change it. */
export function HospitalizationPanel({ hospitalization, canManage, onAdmit, onTransfer, onDischarge }: HospitalizationPanelProps) {
  return (
    <section className={styles['hospitalization-panel']} aria-labelledby="hospitalization-panel-title">
      <header className={styles['hospitalization-panel__header']}>
        <h2 id="hospitalization-panel-title" className={styles['hospitalization-panel__header__title']}>
          <BedDouble aria-hidden="true" />
          Internação
        </h2>
        <StatusPill label={hospitalization ? 'Ativa' : 'Sem internação'} tone={hospitalization ? 'success' : 'neutral'} />
      </header>

      {hospitalization ? (
        <ul className={styles['hospitalization-panel__details']}>
          <li>
            <BedDouble aria-hidden="true" />
            <span>{hospitalization.kennel?.name ?? 'Baia não informada'}</span>
          </li>
          <li>
            <CalendarClock aria-hidden="true" />
            <span>Internado {formatRelativeDay(hospitalization.admissionDate)}</span>
          </li>
          {hospitalization.admissionReason && (
            <li>
              <Stethoscope aria-hidden="true" />
              <span>{hospitalization.admissionReason}</span>
            </li>
          )}
        </ul>
      ) : (
        <p className={styles['hospitalization-panel__empty']}>Interne o paciente para agendar medicações, exames e aferições.</p>
      )}

      {canManage ? (
        <div className={styles['hospitalization-panel__actions']}>
          {hospitalization ? (
            <>
              <Button variant="outlined" onClick={onTransfer}>
                <ArrowRightLeft aria-hidden="true" />
                Transferir baia
              </Button>
              <Button onClick={onDischarge}>
                <LogOut aria-hidden="true" />
                Dar alta
              </Button>
            </>
          ) : (
            <Button onClick={onAdmit}>
              <ClipboardPlus aria-hidden="true" />
              Internar paciente
            </Button>
          )}
        </div>
      ) : (
        <p className={styles['hospitalization-panel__restricted']}>Apenas veterinários e administradores alteram a internação.</p>
      )}
    </section>
  );
}
