import { AdministrationRoute, PrescriptionItemType } from '@nfcarevet/common';
import { Activity, Droplet, Pill, Stethoscope } from 'lucide-react';

import type { IconComponent } from '@/interfaces/icon.types';

export const PRESCRIPTION_ITEM_TYPE: Record<PrescriptionItemType, { label: string; icon: IconComponent }> = {
  [PrescriptionItemType.MEDICATION]: { label: 'Medicação', icon: Pill },
  [PrescriptionItemType.PROCEDURE]: { label: 'Procedimento', icon: Stethoscope },
  [PrescriptionItemType.VITAL_CHECK]: { label: 'Sinais vitais', icon: Activity },
  [PrescriptionItemType.EXAM]: { label: 'Exame', icon: Droplet },
};

export const ADMINISTRATION_ROUTE_LABEL: Record<AdministrationRoute, string> = {
  [AdministrationRoute.ORAL]: 'Oral (VO)',
  [AdministrationRoute.SUBCUTANEOUS]: 'Subcutânea (SC)',
  [AdministrationRoute.INTRAVENOUS]: 'Intravenosa (IV)',
  [AdministrationRoute.INTRAMUSCULAR]: 'Intramuscular (IM)',
  [AdministrationRoute.TOPICAL]: 'Tópica',
  [AdministrationRoute.INHALATION]: 'Inalatória',
};
