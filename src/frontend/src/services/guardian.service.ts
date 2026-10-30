import type { CreateGuardianPayload, Guardian, UpdateGuardianPayload } from '@/interfaces/guardian.types';
import { GUARDIANS_MOCK } from '@/mocks/guardians.mock';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';
import { normalizeText } from '@/utils/normalizeText';

import { httpClient } from './http-client';
import { mockNotFound, mockResponse, USE_MOCKS } from './mock-response';

const withPatients = (guardian: Guardian): Guardian => ({
  ...guardian,
  patients: PATIENTS_MOCK.filter((patient) => patient.guardianId === guardian.id),
});

export const guardianService = {
  /** Pending API: GET /guardians/:id (with `patients`) */
  async getById(guardianId: string): Promise<Guardian> {
    if (USE_MOCKS) {
      const guardian = GUARDIANS_MOCK.find(({ id }) => id === guardianId);
      return guardian ? mockResponse(withPatients(guardian)) : mockNotFound('Tutor');
    }

    const { data } = await httpClient.get<Guardian>(`/guardians/${guardianId}`);
    return data;
  },

  /** Pending API: GET /guardians?query= (matches name, CPF or a patient's name) */
  async search(query: string): Promise<Guardian[]> {
    if (USE_MOCKS) {
      const term = normalizeText(query);
      const results = GUARDIANS_MOCK.map(withPatients).filter((guardian) =>
        [guardian.name, guardian.cpf ?? '', ...(guardian.patients ?? []).map(({ name }) => name)].some((value) =>
          normalizeText(value).includes(term),
        ),
      );
      return mockResponse(results);
    }

    const { data } = await httpClient.get<Guardian[]>('/guardians', { params: { query } });
    return data;
  },

  /** Pending API: POST /guardians */
  async create(payload: CreateGuardianPayload): Promise<Guardian> {
    if (USE_MOCKS) {
      const now = new Date().toISOString();
      const guardian: Guardian = { ...payload, id: `guardian-${Date.now()}`, isActive: true, createdAt: now, updatedAt: now };
      GUARDIANS_MOCK.unshift(guardian);
      return mockResponse(withPatients(guardian));
    }

    const { data } = await httpClient.post<Guardian>('/guardians', payload);
    return data;
  },

  /** Pending API: PATCH /guardians/:id */
  async update(guardianId: string, payload: UpdateGuardianPayload): Promise<Guardian> {
    if (USE_MOCKS) {
      const guardian = GUARDIANS_MOCK.find(({ id }) => id === guardianId);
      if (!guardian) return mockNotFound('Tutor');

      Object.assign(guardian, payload, { updatedAt: new Date().toISOString() });
      return mockResponse(withPatients(guardian));
    }

    const { data } = await httpClient.patch<Guardian>(`/guardians/${guardianId}`, payload);
    return data;
  },
};
