import type { ICreateUserPayload, IUpdateUserPayload, IUser } from '@nfcarevet/common';
import { UserRole } from '@nfcarevet/common';

import { httpClient } from './http-client';
import { mockResponse, USE_MOCKS } from './mock-response';

const USERS_MOCK: IUser[] = [
  {
    id: 'user-camila',
    name: 'Dra. Camila Andrade (Admin)',
    email: 'admin@nfcarevet.com',
    role: UserRole.ADMIN,
    badgeUid: 'BADGE001',
    avatarUrl: null,
    active: true,
    createdAt: '2025-01-15T08:00:00.000Z',
  },
  {
    id: 'user-madalena',
    name: 'Dra. Madalena Silva',
    email: 'madalena@nfcarevet.com',
    role: UserRole.VET,
    badgeUid: 'BADGE002',
    avatarUrl: null,
    active: true,
    createdAt: '2025-01-20T09:00:00.000Z',
  },
  {
    id: 'user-paxe',
    name: 'Dr. Marcos Paxe (Mr Paxe)',
    email: 'paxe@nfcarevet.com',
    role: UserRole.VET,
    badgeUid: 'BADGE004',
    avatarUrl: null,
    active: true,
    createdAt: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'user-rafael',
    name: 'Dr. Rafael Mendes',
    email: 'rafael@nfcarevet.com',
    role: UserRole.VET,
    badgeUid: 'BADGE005',
    avatarUrl: null,
    active: true,
    createdAt: '2025-02-05T10:30:00.000Z',
  },
  {
    id: 'user-carlos',
    name: 'Carlos Recepção',
    email: 'recepcao@nfcarevet.com',
    role: UserRole.REC,
    badgeUid: 'BADGE003',
    avatarUrl: null,
    active: true,
    createdAt: '2025-02-10T11:00:00.000Z',
  },
  {
    id: 'user-fernanda',
    name: 'Fernanda Oliveira',
    email: 'fernanda@nfcarevet.com',
    role: UserRole.REC,
    badgeUid: 'BADGE006',
    avatarUrl: null,
    active: true,
    createdAt: '2025-02-15T14:00:00.000Z',
  },
];

let mockUsersList = [...USERS_MOCK];

export const userService = {
  async list(): Promise<IUser[]> {
    if (USE_MOCKS) return mockResponse(mockUsersList);
    const { data } = await httpClient.get<IUser[]>('/users');
    return data;
  },

  async getById(id: string): Promise<IUser> {
    if (USE_MOCKS) {
      const user = mockUsersList.find((u) => u.id === id);
      if (!user) throw new Error('Usuário não encontrado');
      return mockResponse(user);
    }
    const { data } = await httpClient.get<IUser>(`/users/${id}`);
    return data;
  },

  async create(payload: ICreateUserPayload): Promise<IUser> {
    if (USE_MOCKS) {
      const newUser: IUser = {
        id: `user-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        badgeUid: payload.badgeUid ?? null,
        avatarUrl: payload.avatarUrl ?? null,
        active: payload.active ?? true,
        createdAt: new Date().toISOString(),
      };
      mockUsersList = [newUser, ...mockUsersList];
      return mockResponse(newUser);
    }
    const { data } = await httpClient.post<IUser>('/users', payload);
    return data;
  },

  async update(id: string, payload: IUpdateUserPayload): Promise<IUser> {
    if (USE_MOCKS) {
      mockUsersList = mockUsersList.map((u) => (u.id === id ? { ...u, ...payload } : u));
      const updated = mockUsersList.find((u) => u.id === id);
      if (!updated) throw new Error('Usuário não encontrado');
      return mockResponse(updated);
    }
    const { data } = await httpClient.patch<IUser>(`/users/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<{ message: string }> {
    if (USE_MOCKS) {
      mockUsersList = mockUsersList.map((u) => (u.id === id ? { ...u, active: false } : u));
      return mockResponse({ message: 'Usuário desativado com sucesso.' });
    }
    const { data } = await httpClient.delete<{ message: string }>(`/users/${id}`);
    return data;
  },
};
