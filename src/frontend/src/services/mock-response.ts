import { ApiError } from './api-error';

/** Mocks stay on until VITE_USE_MOCKS is explicitly "false". */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

const MOCK_LATENCY_MS = 250;

/** Resolves a copy of the mock after a small delay, so loading states show up like with the real API. */
export function mockResponse<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(data)), MOCK_LATENCY_MS);
  });
}

export function mockNotFound(resource: string): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => reject(new ApiError(`${resource} não encontrado.`, 404)), MOCK_LATENCY_MS);
  });
}
