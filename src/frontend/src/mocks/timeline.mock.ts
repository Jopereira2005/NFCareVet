import { EventType } from '@nfcarevet/common';

import type { TimelineEvent } from '@/interfaces/clinical-event.types';

import { minutesFromNow } from './mock-dates';
import { NURSE_MOCK, VET_MOCK } from './users.mock';

const vitalSigns = (index: number, patient: { id: string; name: string }, hospitalizationId: string): TimelineEvent => ({
  id: `event-${patient.id}-${index}`,
  hospitalizationId,
  eventType: EventType.VITAL_SIGNS,
  title: 'Sinais Vitais Registrados',
  metrics: {
    heartRate: 96,
    respiratoryRate: 24,
    temperature: 38.6,
    systolicBP: 120,
    diastolicBP: 80,
    capillaryRefillTime: '< 2s',
    notes: 'Mucosas normocoradas, paciente alerta.',
  },
  recordedAt: minutesFromNow(-(index + 1) * 120),
  executor: NURSE_MOCK,
  prescribedBy: VET_MOCK,
  patient,
});

export const TIMELINE_MOCK: TimelineEvent[] = [
  ...Array.from({ length: 5 }, (_, index) => vitalSigns(index, { id: 'pet-8831', name: 'Thor' }, 'hosp-thor')),
  ...Array.from({ length: 2 }, (_, index) => vitalSigns(index + 5, { id: 'pet-6022', name: 'Mel' }, 'hosp-mel')),
];
