import type {
  ICreateUserPayload,
  IPatientPhotoUploadUrlRequest,
  IPatientPhotoUploadUrlResponse,
  IUpdateUserPayload,
  IUser,
} from '@nfcarevet/common';
import { UserRole } from '@nfcarevet/common';

import { findMockCollarByUid, setMockUserBadge } from '@/mocks/nfc-registry.mock';
import { useSessionStore } from '@/stores/useSessionStore';

import { ApiError } from './api-error';
import { httpClient } from './http-client';
import { mockResponse, USE_MOCKS } from './mock-response';

const USERS_MOCK: IUser[] = [
  {
    id: 'user-camila',
    name: 'Dra. Camila Andrade (Admin)',
    email: 'admin@nfcarevet.com',
    role: UserRole.ADMIN,
    badgeUid: 'BADGE001',
    avatarUrl:
      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80',
    active: true,
    createdAt: '2025-01-15T08:00:00.000Z',
  },
  {
    id: 'user-madalena',
    name: 'Dra. Madalena Silva',
    email: 'madalena@nfcarevet.com',
    role: UserRole.VET,
    badgeUid: 'BADGE002',
    avatarUrl:
      'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=256&h=256&q=80',
    active: true,
    createdAt: '2025-01-20T09:00:00.000Z',
  },
  {
    id: 'user-paxe',
    name: 'Dr. Marcos Paxe (Mr Paxe)',
    email: 'paxe@nfcarevet.com',
    role: UserRole.VET,
    badgeUid: 'BADGE004',
    avatarUrl:
      'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=256&h=256&q=80',
    active: true,
    createdAt: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'user-rafael',
    name: 'Dr. Rafael Mendes',
    email: 'rafael@nfcarevet.com',
    role: UserRole.VET,
    badgeUid: 'BADGE005',
    avatarUrl:
      'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80',
    active: true,
    createdAt: '2025-02-05T10:30:00.000Z',
  },
  {
    id: 'user-carlos',
    name: 'Carlos Recepção',
    email: 'recepcao@nfcarevet.com',
    role: UserRole.REC,
    badgeUid: 'BADGE003',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
    active: true,
    createdAt: '2025-02-10T11:00:00.000Z',
  },
  {
    id: 'user-fernanda',
    name: 'Fernanda Oliveira',
    email: 'fernanda@nfcarevet.com',
    role: UserRole.REC,
    badgeUid: 'BADGE006',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
    active: true,
    createdAt: '2025-02-15T14:00:00.000Z',
  },
];

let mockUsersList = [...USERS_MOCK];

const syncCurrentSessionIfSelf = (updatedUser: IUser) => {
  const currentUser = useSessionStore.getState().user;
  if (
    currentUser &&
    (currentUser.id === updatedUser.id ||
      currentUser.email.toLowerCase() === updatedUser.email.toLowerCase())
  ) {
    useSessionStore.getState().updateCurrentUser({
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      badgeUid: updatedUser.badgeUid,
      avatarUrl: updatedUser.avatarUrl,
    });
  }
};

export const userService = {
  async list(): Promise<IUser[]> {
    if (USE_MOCKS) {
      for (const u of mockUsersList) syncCurrentSessionIfSelf(u);
      return mockResponse(mockUsersList);
    }
    const { data } = await httpClient.get<IUser[]>('/users');
    for (const u of data) syncCurrentSessionIfSelf(u);
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
      if (payload.badgeUid) {
        const sanitized = payload.badgeUid.replace(/[:\s-]/g, '').toUpperCase();
        const existingCollar = findMockCollarByUid(sanitized);
        if (existingCollar) {
          const patient = existingCollar.patientName
            ? `coleira do paciente "${existingCollar.patientName}"`
            : `coleira no inventário (#${existingCollar.publicCode})`;
          return Promise.reject(
            new ApiError(
              `A tag [${sanitized}] já está cadastrada como ${patient} e não pode ser vinculada como crachá de colaborador.`,
              409,
            ),
          );
        }

        const existingBadge = mockUsersList.find(
          (u) => u.badgeUid && u.badgeUid.replace(/[:\s-]/g, '').toUpperCase() === sanitized,
        );
        if (existingBadge) {
          return Promise.reject(
            new ApiError(
              `O crachá [${sanitized}] já está associado a outro colaborador (${existingBadge.name}).`,
              409,
            ),
          );
        }
      }

      const newUser: IUser = {
        id: `user-${Date.now()}`,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        badgeUid: payload.badgeUid ? payload.badgeUid.replace(/[:\s-]/g, '').toUpperCase() : null,
        avatarUrl: payload.avatarUrl ?? null,
        active: payload.active ?? true,
        createdAt: new Date().toISOString(),
      };
      if (newUser.badgeUid) {
        setMockUserBadge(newUser.id, newUser.name, newUser.badgeUid);
      }
      mockUsersList = [newUser, ...mockUsersList];
      return mockResponse(newUser);
    }
    const { data } = await httpClient.post<IUser>('/users', payload);
    return data;
  },

  async update(id: string, payload: IUpdateUserPayload): Promise<IUser> {
    if (USE_MOCKS) {
      if (payload.badgeUid) {
        const sanitized = payload.badgeUid.replace(/[:\s-]/g, '').toUpperCase();
        const existingCollar = findMockCollarByUid(sanitized);
        if (existingCollar) {
          const patient = existingCollar.patientName
            ? `coleira do paciente "${existingCollar.patientName}"`
            : `coleira no inventário (#${existingCollar.publicCode})`;
          return Promise.reject(
            new ApiError(
              `A tag [${sanitized}] já está cadastrada como ${patient} e não pode ser vinculada como crachá de colaborador.`,
              409,
            ),
          );
        }

        const existingBadge = mockUsersList.find(
          (u) =>
            u.id !== id &&
            u.badgeUid &&
            u.badgeUid.replace(/[:\s-]/g, '').toUpperCase() === sanitized,
        );
        if (existingBadge) {
          return Promise.reject(
            new ApiError(
              `O crachá [${sanitized}] já está associado a outro colaborador (${existingBadge.name}).`,
              409,
            ),
          );
        }
      }

      const updatedBadge =
        payload.badgeUid !== undefined
          ? payload.badgeUid
            ? payload.badgeUid.replace(/[:\s-]/g, '').toUpperCase()
            : null
          : undefined;

      mockUsersList = mockUsersList.map((u) =>
        u.id === id
          ? {
              ...u,
              ...payload,
              ...(updatedBadge !== undefined && { badgeUid: updatedBadge }),
            }
          : u,
      );
      const updated = mockUsersList.find((u) => u.id === id);
      if (!updated) throw new Error('Usuário não encontrado');
      if (updatedBadge !== undefined) {
        setMockUserBadge(updated.id, updated.name, updated.badgeUid ?? null);
      }
      syncCurrentSessionIfSelf(updated);
      return mockResponse(updated);
    }
    const { data } = await httpClient.patch<IUser>(`/users/${id}`, payload);
    syncCurrentSessionIfSelf(data);
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

  async requestAvatarUploadUrl(
    userId: string,
    payload: IPatientPhotoUploadUrlRequest,
  ): Promise<IPatientPhotoUploadUrlResponse> {
    if (USE_MOCKS) {
      const key = `users/${userId}/${Date.now()}.webp`;
      return mockResponse({
        uploadUrl: `mock://r2-presigned/${key}`,
        publicUrl:
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&h=256&q=80',
        key,
        expiresIn: 120,
      });
    }
    const { data } = await httpClient.post<IPatientPhotoUploadUrlResponse>(
      `/users/${userId}/avatar-upload-url`,
      payload,
    );
    return data;
  },
};
