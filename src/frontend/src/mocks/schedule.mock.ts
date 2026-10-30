import { PrescriptionItemType, PrescriptionStatus } from '@nfcarevet/common';

import type { PendingScheduleItem } from '@/interfaces/prescription.types';

import { minutesFromNow } from './mock-dates';
import { NURSE_MOCK, VET_MOCK } from './users.mock';

const THOR = { id: 'pet-8831', name: 'Thor', species: 'Canina', breed: 'Golden Retriever', isFasting: false, allergies: 'Dipirona', behaviorNotes: null };
const MEL = { id: 'pet-6022', name: 'Mel', species: 'Felina', breed: 'Siamês', isFasting: true, allergies: 'Penicilina', behaviorNotes: null };

const scheduleItem = (
  id: string,
  title: string,
  instructions: string,
  minutesFromNowValue: number,
  itemType: PrescriptionItemType,
): PendingScheduleItem['item'] => ({
  id,
  prescriptionId: `presc-${id}`,
  itemType,
  title,
  instructions,
  scheduledTime: minutesFromNow(minutesFromNowValue),
  status: PrescriptionStatus.PENDING,
  createdAt: minutesFromNow(-24 * 60),
});

export const PENDING_SCHEDULE_MOCK: PendingScheduleItem[] = [
  {
    item: scheduleItem('item-1', 'Coleta de Sangue', 'Controle de plaquetas pós-infusão', -25, PrescriptionItemType.EXAM),
    hospitalizationId: 'hosp-thor',
    patient: THOR,
    kennel: { id: 'kennel-lab', name: 'Laboratório Central' },
    isOverdue: true,
    minutesOverdue: 25,
    assignee: VET_MOCK,
  },
  {
    item: scheduleItem('item-2', 'Aplicação de Antibiótico', 'Ceftriaxona 25mg/kg IV', 40, PrescriptionItemType.MEDICATION),
    hospitalizationId: 'hosp-thor',
    patient: THOR,
    kennel: { id: 'kennel-01', name: 'Baia 01 - UTI Canina' },
    isOverdue: false,
    assignee: VET_MOCK,
  },
  {
    item: scheduleItem('item-3', 'Aferição de Glicemia', 'Jejum de 8h antes da coleta', 180, PrescriptionItemType.VITAL_CHECK),
    hospitalizationId: 'hosp-mel',
    patient: MEL,
    kennel: { id: 'kennel-03', name: 'Baia 03 - Gatil Especial' },
    isOverdue: false,
    assignee: NURSE_MOCK,
  },
];
