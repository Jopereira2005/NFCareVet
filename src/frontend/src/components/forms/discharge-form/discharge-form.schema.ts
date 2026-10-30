import { DischargeReason, type IDischargeHospitalizationPayload } from '@nfcarevet/common';
import { z } from 'zod';

const DISCHARGE_REASONS = Object.values(DischargeReason) as string[];

export const DISCHARGE_REASON_LABEL: Record<DischargeReason, string> = {
  [DischargeReason.MEDICAL_DISCHARGE]: 'Alta médica',
  [DischargeReason.EXTERNAL_TRANSFER]: 'Transferência externa',
  [DischargeReason.DECEASED]: 'Óbito',
  [DischargeReason.OTHER]: 'Outro',
};

export const dischargeFormSchema = z
  .object({
    dischargeReason: z.string().refine((value) => DISCHARGE_REASONS.includes(value), 'Selecione o motivo da alta'),
    dischargeNotes: z.string().trim().max(1000, 'Use no máximo 1000 caracteres'),
    medicalRecommendations: z.string().trim().max(1000, 'Use no máximo 1000 caracteres'),
  })
  // "Outro" alone says nothing in the record, so it needs an explanation
  .refine((values) => values.dischargeReason !== DischargeReason.OTHER || values.dischargeNotes.length >= 10, {
    path: ['dischargeNotes'],
    message: 'Descreva o motivo com pelo menos 10 caracteres',
  });

export type DischargeFormValues = z.infer<typeof dischargeFormSchema>;

export const DISCHARGE_DEFAULTS: DischargeFormValues = {
  dischargeReason: DischargeReason.MEDICAL_DISCHARGE,
  dischargeNotes: '',
  medicalRecommendations: '',
};

export const toDischargePayload = (values: DischargeFormValues): IDischargeHospitalizationPayload => ({
  dischargeReason: values.dischargeReason as DischargeReason,
  dischargeNotes: values.dischargeNotes || undefined,
  // Home-care instructions don't apply after a death
  medicalRecommendations:
    values.dischargeReason === DischargeReason.DECEASED ? undefined : values.medicalRecommendations || undefined,
});
