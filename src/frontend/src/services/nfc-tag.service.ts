import type { NfcTagInventoryItem } from '@/interfaces/nfc.types';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';

import { ApiError } from './api-error';
import { httpClient } from './http-client';
import { mockNotFound, mockResponse, USE_MOCKS } from './mock-response';

const EXTRA_TAGS_MOCK: NfcTagInventoryItem[] = [
  {
    id: 'tag-7701',
    tagUid: '04A1B2C3D47701',
    publicCode: 'VET-7701',
    active: true,
    createdAt: '2025-03-02T10:00:00.000Z',
    occupant: null,
  },
];

const buildMockInventory = (): NfcTagInventoryItem[] => {
  const fromPatients: NfcTagInventoryItem[] = PATIENTS_MOCK.flatMap((patient) =>
    patient.nfcTag
      ? [
          {
            ...patient.nfcTag,
            occupant: patient.activeHospitalization
              ? {
                  hospitalizationId: patient.activeHospitalization.id,
                  patientId: patient.id,
                  patientName: patient.name,
                  species: patient.species,
                  kennelName: patient.activeHospitalization.kennel?.name ?? 'Sem baia',
                }
              : null,
          },
        ]
      : [],
  );

  return [...EXTRA_TAGS_MOCK, ...fromPatients];
};

export const nfcTagService = {
  /** GET /nfc-tags — lists all registered NFC tags and their current occupant. */
  async list(): Promise<NfcTagInventoryItem[]> {
    if (USE_MOCKS) return mockResponse(buildMockInventory());

    const { data } = await httpClient.get<NfcTagInventoryItem[]>('/nfc-tags');
    return data;
  },

  /** POST /nfc-tags — registers a physical NFC tag UID in inventory. */
  async create(tagUid: string): Promise<NfcTagInventoryItem> {
    const sanitizedUid = tagUid.replace(/[:\s-]/g, '').toUpperCase();

    if (USE_MOCKS) {
      const existing = buildMockInventory().find((tag) => tag.tagUid === sanitizedUid);
      if (existing) {
        return Promise.reject(new ApiError(`Tag física [${sanitizedUid}] já cadastrada no inventário.`, 409));
      }
      const created: NfcTagInventoryItem = {
        id: `tag-${Date.now()}`,
        tagUid: sanitizedUid,
        publicCode: `VET-${sanitizedUid.slice(-4)}`,
        active: true,
        createdAt: new Date().toISOString(),
        occupant: null,
      };
      EXTRA_TAGS_MOCK.unshift(created);
      return mockResponse(created);
    }

    const { data } = await httpClient.post<NfcTagInventoryItem>('/nfc-tags', { tagUid: sanitizedUid });
    return data;
  },

  /** PATCH /nfc-tags/:id/inactivate */
  async inactivate(id: string): Promise<NfcTagInventoryItem> {
    if (USE_MOCKS) {
      const extra = EXTRA_TAGS_MOCK.find((tag) => tag.id === id);
      if (extra) {
        extra.active = false;
        return mockResponse(extra);
      }
      const patient = PATIENTS_MOCK.find(({ nfcTag }) => nfcTag?.id === id);
      if (!patient?.nfcTag) return mockNotFound('Tag NFC');
      if (patient.activeHospitalization) {
        return Promise.reject(new ApiError('Não é possível inativar uma tag vinculada a uma internação ativa.', 409));
      }
      patient.nfcTag.active = false;
      return mockResponse({ ...patient.nfcTag, occupant: null });
    }

    const { data } = await httpClient.patch<{ message: string; tag: NfcTagInventoryItem }>(`/nfc-tags/${id}/inactivate`);
    return data.tag;
  },

  /** PATCH /nfc-tags/:id/activate */
  async activate(id: string): Promise<NfcTagInventoryItem> {
    if (USE_MOCKS) {
      const extra = EXTRA_TAGS_MOCK.find((tag) => tag.id === id);
      if (extra) {
        extra.active = true;
        return mockResponse(extra);
      }
      const patient = PATIENTS_MOCK.find(({ nfcTag }) => nfcTag?.id === id);
      if (!patient?.nfcTag) return mockNotFound('Tag NFC');
      patient.nfcTag.active = true;
      return mockResponse({ ...patient.nfcTag, occupant: null });
    }

    const { data } = await httpClient.patch<{ message: string; tag: NfcTagInventoryItem }>(`/nfc-tags/${id}/activate`);
    return data.tag;
  },

  /** DELETE /nfc-tags/:id */
  async remove(id: string): Promise<void> {
    if (USE_MOCKS) {
      const extraIndex = EXTRA_TAGS_MOCK.findIndex((tag) => tag.id === id);
      if (extraIndex >= 0) {
        EXTRA_TAGS_MOCK.splice(extraIndex, 1);
        return mockResponse(undefined);
      }
      const patient = PATIENTS_MOCK.find(({ nfcTag }) => nfcTag?.id === id);
      if (!patient?.nfcTag) return mockNotFound('Tag NFC');
      if (patient.activeHospitalization) {
        return Promise.reject(new ApiError('Não é possível excluir uma tag vinculada a uma internação ativa.', 409));
      }
      patient.nfcTag = null;
      return mockResponse(undefined);
    }

    await httpClient.delete(`/nfc-tags/${id}`);
  },
};
