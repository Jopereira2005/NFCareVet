import {
  HospitalizationStatus,
  type IDischargeHospitalizationPayload,
  type IHospitalization,
  type ILinkTagPayload,
  type ITransferKennelPayload,
  type IUnlinkTagPayload,
} from '@nfcarevet/common';

import type { PaginatedTimeline, TimelineEvent, UpdateClinicalEventPayload } from '@/interfaces/clinical-event.types';
import type { AdmitPatientPayload, TemporalSummary } from '@/interfaces/hospitalization.types';
import { TEMPORAL_SUMMARY_MOCK } from '@/mocks/dashboard.mock';
import { KENNELS_MOCK } from '@/mocks/kennels.mock';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';
import { PENDING_SCHEDULE_MOCK } from '@/mocks/schedule.mock';
import { TIMELINE_MOCK } from '@/mocks/timeline.mock';

import { ApiError } from './api-error';
import { httpClient } from './http-client';
import { mockNotFound, mockResponse, USE_MOCKS } from './mock-response';

const mockConflict = (message: string) => Promise.reject(new ApiError(message, 409));

const isKennelOccupied = (kennelId: string) => PATIENTS_MOCK.some(({ activeHospitalization }) => activeHospitalization?.kennel?.id === kennelId);

const findHospitalizedPatient = (hospitalizationId: string) =>
  PATIENTS_MOCK.find(({ activeHospitalization }) => activeHospitalization?.id === hospitalizationId);

const paginate = (items: TimelineEvent[], page: number, limit: number): PaginatedTimeline => {
  const totalPages = Math.max(1, Math.ceil(items.length / limit));

  return {
    items: items.slice((page - 1) * limit, page * limit),
    meta: { total: items.length, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  };
};

export const hospitalizationService = {
  /** GET /hospitalizations/stats/summary */
  async getTemporalSummary(): Promise<TemporalSummary> {
    if (USE_MOCKS) return mockResponse(TEMPORAL_SUMMARY_MOCK);

    const { data } = await httpClient.get<TemporalSummary>('/hospitalizations/stats/summary');
    return data;
  },

  /** GET /hospitalizations/patient/:patientId/timeline */
  async getPatientTimeline(patientId: string, page = 1, limit = 5): Promise<PaginatedTimeline> {
    if (USE_MOCKS) return mockResponse(paginate(TIMELINE_MOCK.filter(({ patient }) => patient?.id === patientId), page, limit));

    const { data } = await httpClient.get<PaginatedTimeline>(`/hospitalizations/patient/${patientId}/timeline`, {
      params: { page, limit },
    });
    return data;
  },

  /** Pending API: GET /clinical-events?executor=me — events the logged user registered on the shift */
  async listMyRecentEvents(): Promise<TimelineEvent[]> {
    if (USE_MOCKS) return mockResponse(TIMELINE_MOCK);

    const { data } = await httpClient.get<TimelineEvent[]>('/clinical-events', { params: { executor: 'me' } });
    return data;
  },

  /** Pending API: PATCH /clinical-events/:id — corrects a registered activity. */
  async updateClinicalEvent(eventId: string, payload: UpdateClinicalEventPayload): Promise<TimelineEvent> {
    if (USE_MOCKS) {
      const event = TIMELINE_MOCK.find(({ id }) => id === eventId);
      if (!event) return mockNotFound('Registro');

      Object.assign(event, payload);
      return mockResponse(event);
    }

    const { data } = await httpClient.patch<TimelineEvent>(`/clinical-events/${eventId}`, payload);
    return data;
  },

  /** POST /hospitalizations — admits the patient into a kennel (optionally linking an NFC tag). */
  async admit(payload: AdmitPatientPayload): Promise<IHospitalization> {
    if (USE_MOCKS) {
      const patient = PATIENTS_MOCK.find(({ id }) => id === payload.patientId);
      const kennel = KENNELS_MOCK.find(({ id }) => id === payload.kennelId);
      if (!patient || !kennel) return mockNotFound(patient ? 'Baia' : 'Paciente');
      if (patient.activeHospitalization) return mockConflict(`${patient.name} já possui uma internação ativa.`);
      if (isKennelOccupied(kennel.id)) return mockConflict(`${kennel.name} já está ocupada.`);

      const now = new Date().toISOString();
      patient.activeHospitalization = {
        id: `hosp-${Date.now()}`,
        status: HospitalizationStatus.ACTIVE,
        admissionDate: now,
        admissionReason: payload.admissionReason,
        kennel: { id: kennel.id, name: kennel.name },
      };
      if (payload.tagIdentifier && !patient.nfcTag) {
        patient.nfcTag = { id: `tag-${Date.now()}`, tagUid: payload.tagIdentifier, publicCode: `VET-${patient.id.slice(-4)}`, active: true, createdAt: now };
      }

      return mockResponse({
        id: patient.activeHospitalization.id,
        patientId: patient.id,
        kennelId: kennel.id,
        admissionReason: payload.admissionReason,
        status: HospitalizationStatus.ACTIVE,
        admissionDate: now,
      });
    }

    const { data } = await httpClient.post<IHospitalization>('/hospitalizations', payload);
    return data;
  },

  /** POST /hospitalizations/:id/transfer-kennel */
  async transferKennel(hospitalizationId: string, payload: ITransferKennelPayload): Promise<void> {
    if (USE_MOCKS) {
      const patient = findHospitalizedPatient(hospitalizationId);
      const target = KENNELS_MOCK.find(({ id }) => id === payload.targetKennelId);
      if (!patient?.activeHospitalization || !target) return mockNotFound(patient ? 'Baia' : 'Internação');
      if (isKennelOccupied(target.id)) return mockConflict(`${target.name} já está ocupada.`);

      const previousKennelId = patient.activeHospitalization.kennel?.id;
      patient.activeHospitalization.kennel = { id: target.id, name: target.name };
      // Tasks scheduled at the old kennel follow the patient
      for (const entry of PENDING_SCHEDULE_MOCK) {
        if (entry.hospitalizationId === hospitalizationId && entry.kennel.id === previousKennelId) entry.kennel = { id: target.id, name: target.name };
      }
      return mockResponse(undefined);
    }

    await httpClient.post(`/hospitalizations/${hospitalizationId}/transfer-kennel`, payload);
  },

  /** POST /hospitalizations/:id/discharge — ends the hospitalization and frees the kennel. */
  async discharge(hospitalizationId: string, payload: IDischargeHospitalizationPayload): Promise<void> {
    if (USE_MOCKS) {
      const patient = findHospitalizedPatient(hospitalizationId);
      if (!patient) return mockNotFound('Internação');

      patient.activeHospitalization = null;
      // Without a hospitalization the pending items have nowhere to hang
      for (let index = PENDING_SCHEDULE_MOCK.length - 1; index >= 0; index -= 1) {
        if (PENDING_SCHEDULE_MOCK[index].hospitalizationId === hospitalizationId) PENDING_SCHEDULE_MOCK.splice(index, 1);
      }
      return mockResponse(undefined);
    }

    await httpClient.post(`/hospitalizations/${hospitalizationId}/discharge`, payload);
  },

  /** POST /hospitalizations/:id/link-tag — the API registers unknown tags and rejects tags in use (409). */
  async linkTag(hospitalizationId: string, { tagIdentifier }: ILinkTagPayload): Promise<void> {
    if (USE_MOCKS) {
      const patient = findHospitalizedPatient(hospitalizationId);
      if (!patient) return mockNotFound('Internação');

      const owner = PATIENTS_MOCK.find(({ nfcTag }) => nfcTag?.tagUid === tagIdentifier);
      if (owner && owner.id !== patient.id) return mockConflict(`A tag NFC [${tagIdentifier}] já está vinculada ao paciente "${owner.name}".`);

      patient.nfcTag = {
        id: `tag-${Date.now()}`,
        tagUid: tagIdentifier,
        publicCode: `VET-${tagIdentifier.slice(-4)}`,
        active: true,
        createdAt: new Date().toISOString(),
      };
      return mockResponse(undefined);
    }

    await httpClient.post(`/hospitalizations/${hospitalizationId}/link-tag`, { tagIdentifier });
  },

  /** POST /hospitalizations/:id/unlink-tag — frees the collar for another patient. */
  async unlinkTag(hospitalizationId: string, payload: IUnlinkTagPayload): Promise<void> {
    if (USE_MOCKS) {
      const patient = findHospitalizedPatient(hospitalizationId);
      if (!patient?.nfcTag) return mockConflict('Esta internação não possui nenhuma tag NFC vinculada atualmente.');

      patient.nfcTag = null;
      return mockResponse(undefined);
    }

    await httpClient.post(`/hospitalizations/${hospitalizationId}/unlink-tag`, payload);
  },
};
