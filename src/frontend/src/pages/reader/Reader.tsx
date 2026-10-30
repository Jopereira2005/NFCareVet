import { useState } from 'react';
import { Link2, Stethoscope } from 'lucide-react';

import { LinkTagModal, NfcReaderPanel, PatientCard, UnlinkTagModal } from '@/components/features';
import { PageHeading } from '@/components/layout';
import { SegmentedControl, type SegmentedOption } from '@/components/ui';
import { useResolveNfcTag } from '@/hooks/queries/usePatientQueries';
import { useNfcReader } from '@/hooks/useNfcReader';
import { useSearchParamState } from '@/hooks/useSearchParamState';
import type { NfcReading } from '@/interfaces/nfc.types';
import type { Patient } from '@/interfaces/patient.types';
import { isNotFoundError } from '@/services/api-error';
import { showToast } from '@/stores/useToastStore';

import styles from './reader.module.scss';

type ReaderMode = 'consult' | 'link';

const READER_MODES = ['consult', 'link'] as const;

const MODE_OPTIONS: SegmentedOption<ReaderMode>[] = [
  { value: 'consult', label: 'Modo Consulta', icon: Stethoscope },
  { value: 'link', label: 'Modo Vínculo', icon: Link2 },
];

const MODE_COPY: Record<ReaderMode, { title: string; description: string }> = {
  consult: {
    title: 'Aproxime o dispositivo',
    description: 'Encoste o leitor ou a traseira do telefone no microchip NFCare da coleira.',
  },
  link: {
    title: 'Aproxime a nova tag',
    description: 'Encoste a tag ou coleira NFCare que será vinculada ao paciente.',
  },
};

/**
 * Used when the browser has no Web NFC (desktop development): consult mode reads Thor's collar,
 * link mode a spare collar — free on the first read, in use once it has been linked.
 */
const SIMULATED_TAG_SERIAL: Record<ReaderMode, string> = {
  consult: '04:A1:B2:C3:D4:88:31',
  link: '04:A1:B2:C3:D4:77:01',
};

type LinkModeDialog = { kind: 'free'; tagUid: string } | { kind: 'in-use'; patient: Patient };

export default function Reader() {
  const [mode, setMode] = useSearchParamState<ReaderMode>('mode', 'consult', READER_MODES);
  const resolveTag = useResolveNfcTag();
  const detectedPatient = mode === 'consult' ? resolveTag.data : undefined;
  const [linkDialog, setLinkDialog] = useState<LinkModeDialog | null>(null);

  const handleRead = ({ uid }: NfcReading) => {
    resolveTag.mutate(uid, {
      onSuccess: (patient) =>
        mode === 'link'
          ? setLinkDialog({ kind: 'in-use', patient })
          : showToast({ tone: 'success', title: 'NFC Detectado com Sucesso', description: 'UID sincronizado e dados atualizados' }),
      onError: (error) => {
        if (!isNotFoundError(error)) return showToast({ tone: 'warning', title: 'Falha na leitura', description: error.message });
        // An unknown tag is exactly what link mode is waiting for
        if (mode === 'link') return setLinkDialog({ kind: 'free', tagUid: uid });
        showToast({ tone: 'warning', title: 'Tag não cadastrada', description: `UID ${uid}` });
      },
    });
  };

  const { status, error, isSupported, start, simulate } = useNfcReader({ onRead: handleRead });

  const handleActivate = () => {
    if (isSupported) {
      void start();
      return;
    }
    simulate(SIMULATED_TAG_SERIAL[mode]);
  };

  const statusLabel = !isSupported
    ? 'Simulação • Toque no sensor'
    : status === 'scanning'
      ? 'NFC Pronto • Sensor Ativo'
      : 'NFC Pronto • Toque para ativar';

  return (
    <>
      <PageHeading title="Leitor NFCare" subtitle="Aproximação de tags, coleiras inteligentes e microchips" />

      <div className={styles['reader']}>
        <SegmentedControl label="Modo do leitor" options={MODE_OPTIONS} value={mode} onChange={setMode} />

        <NfcReaderPanel
          statusLabel={statusLabel}
          title={MODE_COPY[mode].title}
          description={MODE_COPY[mode].description}
          isScanning={status === 'scanning' || resolveTag.isPending}
          error={error}
          onActivate={handleActivate}
        />

        {detectedPatient && (
          <PatientCard
            patient={detectedPatient}
            eyebrow={
              <>
                <span className={styles['reader__detected-dot']} aria-hidden="true" />
                Tag detectada
              </>
            }
          />
        )}
      </div>

      {linkDialog?.kind === 'free' && <LinkTagModal tagUid={linkDialog.tagUid} onClose={() => setLinkDialog(null)} />}
      {linkDialog?.kind === 'in-use' && <UnlinkTagModal patient={linkDialog.patient} onClose={() => setLinkDialog(null)} />}
    </>
  );
}
