import { UserRole, type IAuthResponse, type IBadgeLoginPayload, type ILoginPayload } from '@nfcarevet/common';

import { findMockCollarByUid, findMockUserBadgeByUid } from '@/mocks/nfc-registry.mock';

import { ApiError } from './api-error';
import { httpClient } from './http-client';
import { mockResponse, USE_MOCKS } from './mock-response';

const MIN_PASSWORD_LENGTH = 6;

const MOCK_AUTH_RESPONSE: IAuthResponse = {
  accessToken: 'mock-token',
  user: {
    id: 'user-camila',
    name: 'Dra. Camila Andrade',
    email: 'camila.andrade@nfcarevet.com',
    role: UserRole.ADMIN,
    badgeUid: 'BADGE001',
  },
};

export const sessionService = {
  /** POST /auth/login — signs in with email and password. */
  async login(payload: ILoginPayload): Promise<IAuthResponse> {
    if (USE_MOCKS) {
      // Mirrors the API validation so the form behaves the same with mocks
      if (!payload.email.includes('@') || payload.password.length < MIN_PASSWORD_LENGTH) {
        return Promise.reject(new ApiError('E-mail ou senha inválidos.', 401));
      }
      return mockResponse(MOCK_AUTH_RESPONSE);
    }

    const { data } = await httpClient.post<IAuthResponse>('/auth/login', payload);
    return data;
  },

  /** POST /auth/badge-login — signs in with the staff NFC badge. */
  async badgeLogin(payload: IBadgeLoginPayload): Promise<IAuthResponse> {
    if (USE_MOCKS) {
      const sanitized = payload.badgeUid.replace(/[:\s-]/g, '').toUpperCase();
      const collar = findMockCollarByUid(sanitized);
      if (collar) {
        const patient = collar.patientName
          ? `coleira do paciente "${collar.patientName}"`
          : `coleira de paciente (#${collar.publicCode})`;
        return Promise.reject(
          new ApiError(
            `A tag aproximada pertence à ${patient} e não pode ser usada como crachá de login.`,
            401,
          ),
        );
      }

      const userBadge = findMockUserBadgeByUid(sanitized);
      if (!userBadge && sanitized !== 'BADGE001') {
        return Promise.reject(new ApiError('Crachá NFC não cadastrado ou não reconhecido.', 401));
      }

      return mockResponse(MOCK_AUTH_RESPONSE);
    }

    const { data } = await httpClient.post<IAuthResponse>('/auth/badge-login', payload);
    return data;
  },
};
