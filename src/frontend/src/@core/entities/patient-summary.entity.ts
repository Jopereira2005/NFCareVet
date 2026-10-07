import type { BaseEntity } from './base.entity';

export interface PatientSummary extends BaseEntity {
  name: string;
  status: 'ativo' | 'inativo';
}
