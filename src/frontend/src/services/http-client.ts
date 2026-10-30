import axios from 'axios';

import { getAccessToken, useSessionStore } from '@/stores/useSessionStore';

import { toApiError } from './api-error';

const defaultApiUrl = `http://${window.location.hostname || 'localhost'}:3000`;

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    // Expired or revoked token: dropping the session makes the route guard send the user to login
    if (apiError.status === 401 && getAccessToken()) useSessionStore.getState().signOut();

    return Promise.reject(apiError);
  },
);
