import { UserRole, type IAuthResponse, type IBadgeLoginPayload, type ILoginPayload } from '@nfcarevet/common';

import { CURRENT_USER_MOCK } from '@/mocks/users.mock';

import { ApiError } from './api-error';
import { httpClient } from './http-client';
import { mockResponse, USE_MOCKS } from './mock-response';

const MOCK_AUTH_RESPONSE: IAuthResponse = {
  accessToken: 'mock-access-token',
  user: { ...CURRENT_USER_MOCK, role: UserRole.ADMIN },
};

const MIN_PASSWORD_LENGTH = 6;

export const sessionService = {
  /** POST /auth/login */
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
    if (USE_MOCKS) return mockResponse(MOCK_AUTH_RESPONSE);

    const { data } = await httpClient.post<IAuthResponse>('/auth/badge-login', payload);
    return data;
  },
};
