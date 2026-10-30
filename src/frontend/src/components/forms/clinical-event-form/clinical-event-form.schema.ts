import { EventType } from '@nfcarevet/common';
import { z } from 'zod';

import type { TimelineEvent, UpdateClinicalEventPayload } from '@/interfaces/clinical-event.types';
import { toDateTimeLocalValue } from '@/utils/toDateTimeLocalValue';

import { toVitalSignsMetrics, toVitalSignsValues, VITAL_SIGN_FIELDS, vitalSignsShape } from '../vital-signs-fields/vital-signs.schema';

export const clinicalEventFormSchema = z.object({
  title: z.string().trim().min(3, 'Descreva o registro').max(120, 'Use no máximo 120 caracteres'),
  recordedAt: z.string().refine((value) => {
    const time = Date.parse(value);
    return !Number.isNaN(time) && time <= Date.now();
  }, 'Informe um horário que já passou'),
  ...vitalSignsShape,
  notes: z.string().trim().max(500, 'Use no máximo 500 caracteres'),
});

export type ClinicalEventFormValues = z.infer<typeof clinicalEventFormSchema>;

export const toClinicalEventFormValues = ({ title, recordedAt, metrics, description, eventType }: TimelineEvent): ClinicalEventFormValues => ({
  title,
  recordedAt: toDateTimeLocalValue(recordedAt),
  ...toVitalSignsValues(metrics),
  // Vital signs keep their free text in `metrics.notes`; other events in `description`
  notes: eventType === EventType.VITAL_SIGNS ? String(metrics?.notes ?? '') : (description ?? ''),
});

const MEASURED_KEYS = [...Object.keys(VITAL_SIGN_FIELDS), 'capillaryRefillTime', 'notes'];

export const toUpdateClinicalEventPayload = (values: ClinicalEventFormValues, event: TimelineEvent): UpdateClinicalEventPayload => {
  const base = { title: values.title, recordedAt: new Date(values.recordedAt).toISOString() };

  if (event.eventType !== EventType.VITAL_SIGNS) return { ...base, description: values.notes || undefined };

  // Keeps metrics this form doesn't edit (SpO2, pain score…) and drops the ones the user cleared
  const untouchedMetrics = Object.fromEntries(Object.entries(event.metrics ?? {}).filter(([key]) => !MEASURED_KEYS.includes(key)));

  return {
    ...base,
    metrics: { ...untouchedMetrics, ...toVitalSignsMetrics(values), ...(values.notes ? { notes: values.notes } : {}) },
  };
};
