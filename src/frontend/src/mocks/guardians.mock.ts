import type { Guardian } from '@/interfaces/guardian.types';

import { daysAgoAt } from './mock-dates';

export const GUARDIANS_MOCK: Guardian[] = [
  {
    id: 'guardian-382',
    name: 'Lucas Silva de Oliveira',
    cpf: '111.444.777-35',
    email: 'lucas.silva@email.com',
    phone: '(15) 99123-3292',
    createdAt: '2023-01-12T14:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
    address: 'Rua das Palmeiras, 450 - Apto 82, Pinheiros - São Paulo/SP',
    financial: { status: 'PAID', paymentMethod: 'Boleto' },
    isActive: true,
  },
  {
    id: 'guardian-412',
    name: 'Mariana Costa Ferreira',
    cpf: '390.533.447-05',
    email: 'mariana.costa@email.com',
    phone: '(15) 99876-1020',
    createdAt: daysAgoAt(0, 9, 40),
    updatedAt: daysAgoAt(0, 9, 40),
    address: 'Av. Brasil, 1200 - Jardim América, Sorocaba/SP',
    financial: { status: 'PENDING', paymentMethod: 'Pix' },
    isActive: true,
  },
];
