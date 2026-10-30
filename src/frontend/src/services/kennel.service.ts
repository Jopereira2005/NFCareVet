import type { Kennel } from '@/interfaces/kennel.types';
import { KENNELS_MOCK } from '@/mocks/kennels.mock';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';

import { httpClient } from './http-client';
import { mockResponse, USE_MOCKS } from './mock-response';

export const kennelService = {
  /** Pending API: GET /kennels (active kennels with their current occupant) */
  async list(): Promise<Kennel[]> {
    if (USE_MOCKS) {
      const kennels = KENNELS_MOCK.filter(({ isActive }) => isActive).map((kennel) => {
        const patient = PATIENTS_MOCK.find(({ activeHospitalization }) => activeHospitalization?.kennel?.id === kennel.id);
        return { ...kennel, occupant: patient ? { patientId: patient.id, patientName: patient.name } : null };
      });
      return mockResponse(kennels);
    }

    const { data } = await httpClient.get<Kennel[]>('/kennels');
    return data;
  },
};
