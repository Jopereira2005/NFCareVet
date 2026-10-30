import { useEffect, useEffectEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { useResolveNfcTag } from '@/hooks/queries/usePatientQueries';
import type { NfcReading } from '@/interfaces/nfc.types';
import { getPatientRecordPath } from '@/router/paths';
import { isNotFoundError } from '@/services/api-error';
import { setNfcFallbackHandler, startNfcIfPermitted } from '@/stores/useNfcStore';
import { showToast } from '@/stores/useToastStore';

const READ_VIBRATION_MS = 80;

/**
 * App-wide NFC behavior: a collar read on any screen opens that patient's record.
 * Screens that need readings for something else (Reader, badge login) claim the reader with `useNfcReader`.
 */
export function useNfcPatientNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const resolveTag = useResolveNfcTag();

  const handleRead = useEffectEvent(({ uid }: NfcReading) => {
    // Navigating away would discard whatever is being filled in an open modal
    if (document.querySelector('dialog[open]')) {
      showToast({ tone: 'warning', title: 'Tag lida com um formulário aberto', description: 'Conclua ou feche o formulário e aproxime a tag novamente.' });
      return;
    }

    resolveTag.mutate(uid, {
      onSuccess: (patient) => {
        if ('vibrate' in navigator) navigator.vibrate(READ_VIBRATION_MS);
        const recordPath = getPatientRecordPath(patient.id);
        if (pathname !== recordPath) navigate(recordPath);
        showToast({ tone: 'success', title: `Prontuário de ${patient.name}`, description: `Tag #${patient.nfcTag?.publicCode ?? uid}` });
      },
      onError: (error) =>
        isNotFoundError(error)
          ? showToast({ tone: 'warning', title: 'Tag não cadastrada', description: 'Vincule-a a um paciente no Leitor, em Modo Vínculo.' })
          : showToast({ tone: 'warning', title: 'Falha na leitura', description: error.message }),
    });
  });

  useEffect(() => {
    setNfcFallbackHandler((reading) => handleRead(reading));
    return () => setNfcFallbackHandler(null);
  }, []);

  useEffect(() => {
    void startNfcIfPermitted();
  }, []);
}
