import { isAxiosError } from 'axios';
import type { IApiErrorResponse } from '@nfcarevet/common';

/** Error thrown by every service, so screens never deal with Axios internals. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError<IApiErrorResponse>(error)) {
    const status = error.response?.status ?? 0;
    const apiMessage = error.response?.data?.message;
    const message = Array.isArray(apiMessage) ? apiMessage.join(' ') : apiMessage;

    return new ApiError(message ?? 'Não foi possível conectar ao servidor.', status);
  }

  return new ApiError(error instanceof Error ? error.message : 'Erro inesperado.', 0);
}

export const isNotFoundError = (error: unknown) => error instanceof ApiError && error.isNotFound;
