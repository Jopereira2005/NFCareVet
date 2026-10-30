import type { IDischargeHospitalizationPayload, ILinkTagPayload, ITransferKennelPayload, IUnlinkTagPayload } from '@nfcarevet/common';
import { useMutation, useQuery } from '@tanstack/react-query';

import type { AdmitPatientPayload } from '@/interfaces/hospitalization.types';
import { hospitalizationService } from '@/services/hospitalization.service';
import { dashboardQueries, kennelQueries, patientQueries, scheduleQueries } from '@/services/query-options';

// A hospitalization change moves the patient's status, kennel occupancy, the task queue and the dashboard counters
const HOSPITALIZATION_DEPENDENTS = [patientQueries.all(), kennelQueries.all(), scheduleQueries.all(), dashboardQueries.all()];

export const useKennels = () => useQuery(kennelQueries.list());

export const useAdmitPatient = () =>
  useMutation({
    mutationFn: (payload: AdmitPatientPayload) => hospitalizationService.admit(payload),
    meta: { successMessage: 'Paciente internado', errorMessage: 'Não foi possível internar o paciente', invalidates: HOSPITALIZATION_DEPENDENTS },
  });

export const useTransferKennel = () =>
  useMutation({
    mutationFn: ({ hospitalizationId, payload }: { hospitalizationId: string; payload: ITransferKennelPayload }) =>
      hospitalizationService.transferKennel(hospitalizationId, payload),
    meta: { successMessage: 'Paciente transferido', errorMessage: 'Não foi possível transferir o paciente', invalidates: HOSPITALIZATION_DEPENDENTS },
  });

export const useDischargePatient = () =>
  useMutation({
    mutationFn: ({ hospitalizationId, payload }: { hospitalizationId: string; payload: IDischargeHospitalizationPayload }) =>
      hospitalizationService.discharge(hospitalizationId, payload),
    meta: { successMessage: 'Alta registrada', errorMessage: 'Não foi possível registrar a alta', invalidates: HOSPITALIZATION_DEPENDENTS },
  });

export const useLinkTag = () =>
  useMutation({
    mutationFn: ({ hospitalizationId, payload }: { hospitalizationId: string; payload: ILinkTagPayload }) =>
      hospitalizationService.linkTag(hospitalizationId, payload),
    meta: { successMessage: 'Tag vinculada ao paciente', errorMessage: 'Não foi possível vincular a tag', invalidates: [patientQueries.all()] },
  });

export const useUnlinkTag = () =>
  useMutation({
    mutationFn: ({ hospitalizationId, payload }: { hospitalizationId: string; payload: IUnlinkTagPayload }) =>
      hospitalizationService.unlinkTag(hospitalizationId, payload),
    meta: { successMessage: 'Tag liberada', errorMessage: 'Não foi possível desvincular a tag', invalidates: [patientQueries.all()] },
  });
