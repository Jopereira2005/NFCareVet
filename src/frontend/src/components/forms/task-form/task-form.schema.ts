import { AdministrationRoute, PrescriptionItemType, type ICreatePrescriptionItemPayload } from '@nfcarevet/common';
import { z } from 'zod';

import type { PendingScheduleItem } from '@/interfaces/prescription.types';
import { toDateTimeLocalValue } from '@/utils/toDateTimeLocalValue';

const ITEM_TYPES = Object.values(PrescriptionItemType) as string[];
const ROUTES = Object.values(AdministrationRoute) as string[];
const DEFAULT_LEAD_MINUTES = 30;

export const taskFormSchema = z
  .object({
    hospitalizationId: z.string().min(1, 'Selecione o paciente internado'),
    itemType: z.string().refine((value) => ITEM_TYPES.includes(value), 'Selecione o tipo de tarefa'),
    title: z.string().trim().min(3, 'Descreva a tarefa').max(120, 'Use no máximo 120 caracteres'),
    dosage: z.string().trim().max(50, 'Use no máximo 50 caracteres'),
    route: z.string(),
    scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Informe data e horário'),
    instructions: z.string().trim().max(500, 'Use no máximo 500 caracteres'),
  })
  // Dosage and route only make sense for medication, and the API needs both to administer it
  .superRefine((values, context) => {
    if (values.itemType !== PrescriptionItemType.MEDICATION) return;
    if (!values.dosage) context.addIssue({ code: 'custom', path: ['dosage'], message: 'Informe a dose' });
    if (!ROUTES.includes(values.route)) context.addIssue({ code: 'custom', path: ['route'], message: 'Selecione a via' });
  });

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const getTaskFormDefaults = (hospitalizationId = ''): TaskFormValues => ({
  hospitalizationId,
  itemType: PrescriptionItemType.MEDICATION,
  title: '',
  dosage: '',
  route: '',
  scheduledAt: toDateTimeLocalValue(new Date(Date.now() + DEFAULT_LEAD_MINUTES * 60_000)),
  instructions: '',
});

export const toTaskFormValues = ({ item, hospitalizationId }: PendingScheduleItem): TaskFormValues => ({
  hospitalizationId,
  itemType: item.itemType,
  title: item.title,
  dosage: item.dosage ?? '',
  route: item.route ?? '',
  scheduledAt: toDateTimeLocalValue(item.scheduledTime),
  instructions: item.instructions ?? '',
});

export const toPrescriptionItemPayload = (values: TaskFormValues): ICreatePrescriptionItemPayload => {
  const isMedication = values.itemType === PrescriptionItemType.MEDICATION;

  return {
    itemType: values.itemType as PrescriptionItemType,
    title: values.title,
    dosage: isMedication ? values.dosage : undefined,
    route: isMedication ? (values.route as AdministrationRoute) : undefined,
    // datetime-local is local time; the API stores UTC ISO strings
    scheduledTime: new Date(values.scheduledAt).toISOString(),
    instructions: values.instructions || undefined,
  };
};
