import type { NfcTagUsage, RecentRegistration } from '@/interfaces/dashboard.types';
import { NFC_TAG_USAGE_MOCK } from '@/mocks/dashboard.mock';
import { GUARDIANS_MOCK } from '@/mocks/guardians.mock';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';

import { httpClient } from './http-client';
import { mockResponse, USE_MOCKS } from './mock-response';

const registeredAt = (registration: RecentRegistration) =>
  registration.kind === 'patient' ? registration.patient.createdAt : registration.guardian.createdAt;

export const dashboardService = {
  /** Pending API: GET /nfc-tags/usage */
  async getNfcTagUsage(): Promise<NfcTagUsage> {
    if (USE_MOCKS) return mockResponse(NFC_TAG_USAGE_MOCK);

    const { data } = await httpClient.get<NfcTagUsage>('/nfc-tags/usage');
    return data;
  },

  /** Pending API: GET /registrations/recent?limit= */
  async listRecentRegistrations(limit = 3): Promise<RecentRegistration[]> {
    if (USE_MOCKS) {
      const registrations: RecentRegistration[] = [
        ...PATIENTS_MOCK.map((patient) => ({
          kind: 'patient' as const,
          patient: { ...patient, guardian: GUARDIANS_MOCK.find(({ id }) => id === patient.guardianId) },
        })),
        ...GUARDIANS_MOCK.map((guardian) => ({
          kind: 'guardian' as const,
          guardian: { ...guardian, patients: PATIENTS_MOCK.filter(({ guardianId }) => guardianId === guardian.id) },
        })),
      ];
      const newestFirst = registrations.sort((a, b) => new Date(registeredAt(b)).getTime() - new Date(registeredAt(a)).getTime());
      return mockResponse(newestFirst.slice(0, limit));
    }

    const { data } = await httpClient.get<RecentRegistration[]>('/registrations/recent', { params: { limit } });
    return data;
  },
};
