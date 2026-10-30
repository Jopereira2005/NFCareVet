import { z } from 'zod';

import { parseDecimal } from '@/utils/parseDecimal';

/** Optional numeric field typed as text (accepts "38,6"), validated against a plausible clinical range. */
const measurement = (min: number, max: number, unit: string) =>
  z.string().refine((value) => {
    if (!value.trim()) return true;
    const number = parseDecimal(value);
    return number !== undefined && number >= min && number <= max;
  }, `Valor entre ${min} e ${max} ${unit}`);

/** Numeric vital signs, keyed like `IVitalSignsMetrics` from @nfcarevet/common. */
export const VITAL_SIGN_FIELDS = {
  heartRate: { label: 'FC', unit: 'bpm', schema: measurement(20, 400, 'bpm') },
  respiratoryRate: { label: 'FR', unit: 'mpm', schema: measurement(4, 200, 'mpm') },
  temperature: { label: 'Temperatura', unit: '°C', schema: measurement(30, 45, '°C') },
  systolicBP: { label: 'PA sistólica', unit: 'mmHg', schema: measurement(30, 300, 'mmHg') },
  diastolicBP: { label: 'PA diastólica', unit: 'mmHg', schema: measurement(10, 250, 'mmHg') },
  bloodGlucose: { label: 'Glicemia', unit: 'mg/dL', schema: measurement(10, 1000, 'mg/dL') },
} as const;

export type VitalSignField = keyof typeof VITAL_SIGN_FIELDS;

/** Spread into a form schema: `z.object({ ...vitalSignsShape, … })`. */
export const vitalSignsShape = {
  heartRate: VITAL_SIGN_FIELDS.heartRate.schema,
  respiratoryRate: VITAL_SIGN_FIELDS.respiratoryRate.schema,
  temperature: VITAL_SIGN_FIELDS.temperature.schema,
  systolicBP: VITAL_SIGN_FIELDS.systolicBP.schema,
  diastolicBP: VITAL_SIGN_FIELDS.diastolicBP.schema,
  bloodGlucose: VITAL_SIGN_FIELDS.bloodGlucose.schema,
  capillaryRefillTime: z.string().trim().max(20, 'Use no máximo 20 caracteres'),
};

export type VitalSignsValues = { [Field in keyof typeof vitalSignsShape]: string };

export const EMPTY_VITAL_SIGNS: VitalSignsValues = {
  heartRate: '',
  respiratoryRate: '',
  temperature: '',
  systolicBP: '',
  diastolicBP: '',
  bloodGlucose: '',
  capillaryRefillTime: '',
};

const metricText = (metrics: Record<string, unknown> | null | undefined, key: string) => {
  const value = metrics?.[key];
  return value === undefined || value === null ? '' : String(value).replace('.', ',');
};

/** API metrics → form strings ("38.6" → "38,6"). */
export const toVitalSignsValues = (metrics: Record<string, unknown> | null | undefined): VitalSignsValues => ({
  heartRate: metricText(metrics, 'heartRate'),
  respiratoryRate: metricText(metrics, 'respiratoryRate'),
  temperature: metricText(metrics, 'temperature'),
  systolicBP: metricText(metrics, 'systolicBP'),
  diastolicBP: metricText(metrics, 'diastolicBP'),
  bloodGlucose: metricText(metrics, 'bloodGlucose'),
  capillaryRefillTime: metricText(metrics, 'capillaryRefillTime'),
});

/** Form strings → API metrics; fields left empty are omitted. */
export function toVitalSignsMetrics(values: VitalSignsValues): Record<string, number | string> {
  const metrics: Record<string, number | string> = {};

  for (const field of Object.keys(VITAL_SIGN_FIELDS) as VitalSignField[]) {
    const number = parseDecimal(values[field]);
    if (number !== undefined) metrics[field] = number;
  }
  if (values.capillaryRefillTime) metrics.capillaryRefillTime = values.capillaryRefillTime;

  return metrics;
}
