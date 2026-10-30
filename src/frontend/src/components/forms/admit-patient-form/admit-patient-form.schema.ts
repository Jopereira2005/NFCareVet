import { z } from 'zod';

import type { AdmitPatientPayload } from '@/interfaces/hospitalization.types';

// CreateHospitalizationDto requires reason and preliminary diagnosis
export const admitPatientFormSchema = z.object({
  kennelId: z.string().min(1, 'Selecione a baia'),
  admissionReason: z.string().trim().min(3, 'Informe o motivo da internação').max(200, 'Use no máximo 200 caracteres'),
  preliminaryDiagnosis: z.string().trim().min(3, 'Informe o diagnóstico preliminar').max(500, 'Use no máximo 500 caracteres'),
  tagIdentifier: z.string().trim().max(64, 'Identificador muito longo'),
});

export type AdmitPatientFormValues = z.infer<typeof admitPatientFormSchema>;

export const ADMIT_PATIENT_DEFAULTS: AdmitPatientFormValues = { kennelId: '', admissionReason: '', preliminaryDiagnosis: '', tagIdentifier: '' };

export const toAdmitPatientPayload = (patientId: string, values: AdmitPatientFormValues): AdmitPatientPayload => ({
  patientId,
  kennelId: values.kennelId,
  admissionReason: values.admissionReason,
  preliminaryDiagnosis: values.preliminaryDiagnosis,
  tagIdentifier: values.tagIdentifier || undefined,
});
