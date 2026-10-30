import { useMutation } from '@tanstack/react-query';

import type { CreatePatientPayload, UpdatePatientPayload } from '@/interfaces/patient.types';
import { patientService } from '@/services/patient.service';
import { dashboardQueries, guardianQueries, patientQueries, scheduleQueries } from '@/services/query-options';

export const useCreatePatient = () =>
  useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientService.create(payload),
    meta: {
      successMessage: 'Paciente cadastrado',
      errorMessage: 'Não foi possível cadastrar o paciente',
      // New patient shows up in searches, in the guardian's profile and in "Últimos Cadastrados"
      invalidates: [patientQueries.all(), guardianQueries.all(), dashboardQueries.all()],
    },
  });

export const useUpdatePatient = () =>
  useMutation({
    mutationFn: ({ patientId, payload }: { patientId: string; payload: UpdatePatientPayload }) => patientService.update(patientId, payload),
    meta: {
      successMessage: 'Dados do paciente atualizados',
      errorMessage: 'Não foi possível salvar o paciente',
      // Name, allergies and photo also appear on guardian profiles, task cards and the dashboard
      invalidates: [patientQueries.all(), guardianQueries.all(), scheduleQueries.all(), dashboardQueries.all()],
    },
  });
