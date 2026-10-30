import { useMutation } from '@tanstack/react-query';

import type { CreateGuardianPayload, UpdateGuardianPayload } from '@/interfaces/guardian.types';
import { guardianService } from '@/services/guardian.service';
import { dashboardQueries, guardianQueries, patientQueries } from '@/services/query-options';

export const useCreateGuardian = () =>
  useMutation({
    mutationFn: (payload: CreateGuardianPayload) => guardianService.create(payload),
    meta: {
      successMessage: 'Tutor cadastrado',
      errorMessage: 'Não foi possível cadastrar o tutor',
      invalidates: [guardianQueries.all(), dashboardQueries.all()],
    },
  });

export const useUpdateGuardian = () =>
  useMutation({
    mutationFn: ({ guardianId, payload }: { guardianId: string; payload: UpdateGuardianPayload }) => guardianService.update(guardianId, payload),
    meta: {
      successMessage: 'Dados do tutor atualizados',
      errorMessage: 'Não foi possível salvar o tutor',
      // The guardian's name and phone are shown on the patients' records
      invalidates: [guardianQueries.all(), patientQueries.all(), dashboardQueries.all()],
    },
  });
