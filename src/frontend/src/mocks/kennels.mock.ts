import type { IKennel } from '@nfcarevet/common';

const kennel = (id: string, name: string, notes?: string): IKennel => ({
  id,
  name,
  notes: notes ?? null,
  isActive: true,
  createdAt: '2025-01-10T12:00:00.000Z',
});

/** Same kennels as the backend seed (prisma/seed.ts). Occupancy is derived from the patients mock. */
export const KENNELS_MOCK: IKennel[] = [
  kennel('kennel-01', 'Baia 01 - UTI Canina', 'Monitoramento intensivo'),
  kennel('kennel-02', 'Baia 02 - Canil Médio'),
  kennel('kennel-03', 'Baia 03 - Gatil Especial'),
  kennel('kennel-04', 'Baia 04 - Isolamento Infeccioso', 'Uso exclusivo para doenças infectocontagiosas'),
  kennel('kennel-05', 'Baia 05 - Canil Grande'),
  kennel('kennel-06', 'Baia 06 - Canil Pequeno'),
  kennel('kennel-07', 'Baia 07 - Gatil 02'),
  kennel('kennel-08', 'Baia 08 - Semi-Intensiva'),
];
