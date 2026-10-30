import { PrescriptionItemType, type IApplyPrescriptionItemPayload } from '@nfcarevet/common';
import { z } from 'zod';

import { EMPTY_VITAL_SIGNS, toVitalSignsMetrics, vitalSignsShape } from '../vital-signs-fields/vital-signs.schema';

/** The rules depend on what is being administered, so the schema is built per item type. */
export const createAdministerTaskSchema = (itemType: PrescriptionItemType) =>
  z
    .object({
      ...vitalSignsShape,
      bedsideNotes: z.string().trim().max(500, 'Use no máximo 500 caracteres'),
      doubleChecked: z.boolean(),
    })
    .superRefine((values, context) => {
      // Medication safety: the professional confirms patient, drug, dose, route and time before registering
      if (itemType === PrescriptionItemType.MEDICATION && !values.doubleChecked) {
        context.addIssue({ code: 'custom', path: ['doubleChecked'], message: 'Confirme a dupla checagem antes de registrar' });
      }

      // A vital signs check without any measurement would register an empty event
      if (itemType === PrescriptionItemType.VITAL_CHECK && Object.keys(toVitalSignsMetrics(values)).length === 0) {
        context.addIssue({ code: 'custom', path: ['heartRate'], message: 'Registre ao menos uma aferição' });
      }
    });

export type AdministerTaskFormValues = z.infer<ReturnType<typeof createAdministerTaskSchema>>;

export const ADMINISTER_TASK_DEFAULTS: AdministerTaskFormValues = { ...EMPTY_VITAL_SIGNS, bedsideNotes: '', doubleChecked: false };

export const toApplyTaskPayload = (values: AdministerTaskFormValues, itemType: PrescriptionItemType): IApplyPrescriptionItemPayload => {
  const metrics = itemType === PrescriptionItemType.VITAL_CHECK ? toVitalSignsMetrics(values) : {};

  return {
    bedsideNotes: values.bedsideNotes || undefined,
    metrics: Object.keys(metrics).length > 0 ? metrics : undefined,
  };
};
