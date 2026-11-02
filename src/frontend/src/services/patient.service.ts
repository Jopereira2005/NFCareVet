import axios from 'axios';
import {
  HospitalizationStatus,
  type IBedsideQuickRecord,
  type IPatientPhotoUploadUrlRequest,
  type IPatientPhotoUploadUrlResponse,
} from '@nfcarevet/common';

import type { HistoryPeriod, PatientVisit } from '@/interfaces/hospitalization.types';
import type { CreatePatientPayload, Patient, PatientSex, UpdatePatientPayload } from '@/interfaces/patient.types';
import { GUARDIANS_MOCK } from '@/mocks/guardians.mock';
import { PATIENT_VISITS_MOCK } from '@/mocks/dashboard.mock';
import { PATIENTS_MOCK } from '@/mocks/patients.mock';
import { isWithinPeriod } from '@/utils/isWithinPeriod';
import { normalizeText } from '@/utils/normalizeText';

import { toApiError } from './api-error';
import { httpClient } from './http-client';
import { mockNotFound, mockResponse, USE_MOCKS } from './mock-response';

export interface PatientSearchParams {
  query?: string;
  species?: string;
  sex?: PatientSex;
  hospitalized?: boolean;
}

const withGuardian = (patient: Patient): Patient => ({
  ...patient,
  guardian: GUARDIANS_MOCK.find((guardian) => guardian.id === patient.guardianId),
});

const matchesSearch = (patient: Patient, { query, species, sex, hospitalized }: PatientSearchParams) => {
  const term = normalizeText(query ?? '');
  const searchable = [patient.name, patient.guardian?.name ?? '', patient.nfcTag?.publicCode ?? ''];

  return (
    searchable.some((value) => normalizeText(value).includes(term)) &&
    (!species || patient.species === species) &&
    (!sex || patient.sex === sex) &&
    (hospitalized === undefined || Boolean(patient.activeHospitalization) === hospitalized)
  );
};

/** GET /bedside/:identifier returns the quick record plus admission and tag data (`QuickRecordResponseDto`). */
type BedsideQuickRecordResponse = IBedsideQuickRecord & {
  admissionDate: string;
  admissionReason?: string | null;
  nfcTag?: { id: string; tagUid: string; publicCode: string } | null;
};

/** Bedside quick record → Patient, so the NFC reader shares the same card as the other screens. */
const toPatient = ({ patient, hospitalizationId, admissionDate, admissionReason, kennel, nfcTag }: BedsideQuickRecordResponse): Patient => ({
  ...patient,
  guardianId: patient.guardian.id,
  // The bedside payload omits audit dates; screens never display them for this flow
  guardian: { ...patient.guardian, createdAt: '', updatedAt: '' },
  createdAt: '',
  updatedAt: '',
  nfcTag: nfcTag ? { ...nfcTag, active: true, createdAt: '' } : null,
  activeHospitalization: {
    id: hospitalizationId,
    status: HospitalizationStatus.ACTIVE,
    admissionDate,
    admissionReason: admissionReason ?? null,
    kennel: kennel ? { id: kennel.id, name: kennel.name } : null,
  },
});

export const patientService = {
  /** GET /patients/:id */
  async getById(patientId: string): Promise<Patient> {
    if (USE_MOCKS) {
      const patient = PATIENTS_MOCK.find(({ id }) => id === patientId);
      return patient ? mockResponse(withGuardian(patient)) : mockNotFound('Paciente');
    }

    const { data } = await httpClient.get<Patient>(`/patients/${patientId}`);
    return data;
  },

  /** GET /patients?query=&species=&sex=&hospitalized= */
  async search(params: PatientSearchParams): Promise<Patient[]> {
    if (USE_MOCKS) return mockResponse(PATIENTS_MOCK.map(withGuardian).filter((patient) => matchesSearch(patient, params)));

    const { data } = await httpClient.get<Patient[]>('/patients', { params });
    return data;
  },

  /** GET /bedside/:identifier — resolves the patient hospitalized with the NFC tag. */
  async getByTagUid(tagUid: string): Promise<Patient> {
    if (USE_MOCKS) {
      const patient = PATIENTS_MOCK.find(({ nfcTag }) => nfcTag?.tagUid === tagUid);
      return patient ? mockResponse(withGuardian(patient)) : mockNotFound('Tag');
    }

    const { data } = await httpClient.get<BedsideQuickRecordResponse>(`/bedside/${tagUid}`);
    return toPatient(data);
  },

  /** GET /patients/visits?period= */
  async listVisits(period: HistoryPeriod): Promise<PatientVisit[]> {
    if (USE_MOCKS) {
      const visits = PATIENT_VISITS_MOCK.filter(({ visitedAt }) => isWithinPeriod(visitedAt, period)).flatMap(({ id, patientId, visitedAt }) => {
        const patient = PATIENTS_MOCK.find((candidate) => candidate.id === patientId);
        return patient ? [{ id, visitedAt, patient: withGuardian(patient) }] : [];
      });
      return mockResponse(visits);
    }

    const { data } = await httpClient.get<PatientVisit[]>('/patients/visits', { params: { period } });
    return data;
  },

  /** POST /patients */
  async create(payload: CreatePatientPayload): Promise<Patient> {
    if (USE_MOCKS) {
      const now = new Date().toISOString();
      const patient: Patient = {
        ...payload,
        id: `pet-${Date.now()}`,
        isFasting: payload.isFasting ?? false,
        isCastrated: payload.isCastrated ?? false,
        createdAt: now,
        updatedAt: now,
        nfcTag: null,
        activeHospitalization: null,
      };
      PATIENTS_MOCK.unshift(patient);
      return mockResponse(withGuardian(patient));
    }

    const { data } = await httpClient.post<Patient>('/patients', payload);
    return data;
  },

  /** PATCH /patients/:id */
  async update(patientId: string, payload: UpdatePatientPayload): Promise<Patient> {
    if (USE_MOCKS) {
      const patient = PATIENTS_MOCK.find(({ id }) => id === patientId);
      if (!patient) return mockNotFound('Paciente');

      Object.assign(patient, payload, { updatedAt: new Date().toISOString() });
      return mockResponse(withGuardian(patient));
    }

    const { data } = await httpClient.patch<Patient>(`/patients/${patientId}`, payload);
    return data;
  },

  /** POST /patients/:id/photo-upload-url */
  async requestPhotoUploadUrl(
    patientId: string,
    payload: IPatientPhotoUploadUrlRequest,
  ): Promise<IPatientPhotoUploadUrlResponse> {
    if (USE_MOCKS) {
      const key = `patients/${patientId}/${crypto.randomUUID()}.webp`;
      return mockResponse({
        uploadUrl: `mock://r2/${key}`,
        publicUrl: `mock://r2/${key}`,
        key,
        expiresIn: 120,
      });
    }

    const { data } = await httpClient.post<IPatientPhotoUploadUrlResponse>(
      `/patients/${patientId}/photo-upload-url`,
      payload,
    );
    return data;
  },

  /**
   * Envia o binário diretamente para a Presigned URL do Cloudflare R2 via PUT,
   * sem o interceptor JWT da API interna para não invalidar a assinatura S3 V4.
   */
  async uploadToPresignedUrl(
    uploadUrl: string,
    blob: Blob,
    mimeType: string,
    onProgress?: (percent: number) => void,
  ): Promise<string | void> {
    if (USE_MOCKS || uploadUrl.startsWith('mock://')) {
      onProgress?.(45);
      await mockResponse(null);
      onProgress?.(100);
      return URL.createObjectURL(blob);
    }

    try {
      await axios.put(uploadUrl, blob, {
        headers: {
          'Content-Type': mimeType,
        },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            onProgress?.(percent);
          }
        },
      });
    } catch (error) {
      throw toApiError(error);
    }
  },
};
